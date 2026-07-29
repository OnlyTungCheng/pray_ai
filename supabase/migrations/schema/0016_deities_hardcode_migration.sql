-- Đền Cầu Nguyện — revert Deity (Thần) from a DB table to a hardcoded
-- catalog, per explicit product decision: "thần không cần BE đâu, hardcode
-- là được". Hall (Điện) stays in the DB (schema/0014) — only Deity moves to
-- code, following the exact "small whitelist validator" pattern already
-- used by offering-catalog.ts / avatar-catalog.ts (see
-- src/features/halls/deity-catalog.ts).
--
-- This undoes part of schema/0014_halls_and_deities.sql: drops the
-- `deities` table and its FK/trigger, and converts
-- rooms.primary_deity_id/support_deity_ids from `uuid` (FK to deities) to
-- `text` (storing a deity *slug* from the hardcoded catalog instead). The
-- `halls` table and rooms.hall_id are untouched — Hall stays DB-backed.

-- ============================================================================
-- Drop the old FK-based validation trigger (0014) — deity slugs are now
-- validated against a hardcoded catalog in TypeScript, not a DB table, so
-- the DB-side check must become a plain slug format/whitelist check instead
-- of a foreign-key-style existence check.
-- ============================================================================
drop trigger if exists rooms_check_deities_belong_to_hall on public.rooms;
drop function if exists public.check_room_deities_belong_to_hall();

-- ============================================================================
-- Convert rooms.primary_deity_id / support_deity_ids: uuid -> text (slug)
-- ============================================================================
-- Must drop active_project_rooms (0014) FIRST — Postgres refuses to alter
-- the type of a column referenced by a view ("cannot alter type of a
-- column used by a view or rule"), even via `using` casts. Recreated at the
-- end of this file with the new text-typed columns.
drop view if exists public.active_project_rooms;

-- Drop the old FK constraints first — the columns are being retyped away
-- from uuid entirely, so the old "references deities(id)" constraint no
-- longer makes sense once deities isn't a table.
alter table public.rooms
  drop constraint if exists rooms_primary_deity_id_fkey;

alter table public.rooms
  alter column primary_deity_id type text using primary_deity_id::text,
  alter column support_deity_ids type text[] using support_deity_ids::text[];

-- ============================================================================
-- Drop the deities table entirely.
-- ============================================================================
drop table if exists public.deities;

-- ============================================================================
-- New validation trigger: same shape/intent as 0014's, but checks slugs
-- against a hardcoded whitelist array (kept in sync with
-- src/features/halls/deity-catalog.ts by convention/comment, the same way
-- room_offerings' `check` constraint in 0011 is kept in sync with
-- offering-catalog.ts) instead of querying a `deities` table.
--
-- IMPORTANT: if you add/remove a deity in deity-catalog.ts, this array
-- must be updated too, in a follow-up migration — there is no single
-- source of truth shared between TypeScript and SQL for this whitelist,
-- same tradeoff already accepted for room_offerings.offering_id/
-- room_members.avatar_id in 0011/0013.
-- ============================================================================
create or replace function public.check_room_deities_belong_to_hall()
returns trigger
language plpgsql
as $$
declare
  valid_deity_slugs text[] := array[
    'vercel', 'netlify', 'cloudflare',
    'github', 'gitlab', 'bitbucket',
    'supabase', 'firebase', 'postgresql'
  ];
  hall_slug_for_deity jsonb := '{
    "vercel": "khai-trien", "netlify": "khai-trien", "cloudflare": "khai-trien",
    "github": "hop-nhat", "gitlab": "hop-nhat", "bitbucket": "hop-nhat",
    "supabase": "du-hai", "firebase": "du-hai", "postgresql": "du-hai"
  }'::jsonb;
  room_hall_slug text;
  bad_slug text;
begin
  if new.hall_id is null then
    if new.primary_deity_id is not null or coalesce(array_length(new.support_deity_ids, 1), 0) > 0 then
      raise exception 'A room with no hall_id cannot have a primary or support deity';
    end if;
    return new;
  end if;

  select slug into room_hall_slug from public.halls where id = new.hall_id;

  if new.primary_deity_id is not null then
    if not (new.primary_deity_id = any(valid_deity_slugs)) then
      raise exception 'primary_deity_id % is not a known deity slug', new.primary_deity_id;
    end if;
    if hall_slug_for_deity ->> new.primary_deity_id is distinct from room_hall_slug then
      raise exception 'primary_deity_id % does not belong to hall %', new.primary_deity_id, room_hall_slug;
    end if;
  end if;

  if new.support_deity_ids is not null and array_length(new.support_deity_ids, 1) > 0 then
    select sd into bad_slug
    from unnest(new.support_deity_ids) as sd
    where not (sd = any(valid_deity_slugs)) or hall_slug_for_deity ->> sd is distinct from room_hall_slug
    limit 1;

    if bad_slug is not null then
      raise exception 'support_deity_ids contains a deity (%) not belonging to hall %', bad_slug, room_hall_slug;
    end if;
  end if;

  return new;
end;
$$;

drop trigger if exists rooms_check_deities_belong_to_hall on public.rooms;
create trigger rooms_check_deities_belong_to_hall
  before insert or update on public.rooms
  for each row
  execute function public.check_room_deities_belong_to_hall();

-- ============================================================================
-- Recreate active_project_rooms (dropped above to allow the column type
-- change) — same columns as 0014's version, just now with a text-typed
-- primary_deity_id instead of uuid. Re-grant BOTH roles per the lesson
-- documented in 0014 (drop+create loses any grant attached to the old view
-- object, so every recreation must re-grant everyone who previously had access).
-- ============================================================================
create view public.active_project_rooms
with (security_invoker = true)
as
select
  id,
  slug,
  project_name,
  event_type,
  title,
  status,
  incense_count,
  bell_count,
  prayer_count,
  energy,
  created_at,
  expires_at,
  offering_count,
  hall_id,
  primary_deity_id
from public.rooms
where slug <> 'sanh-chung'
  and expires_at > now()
order by created_at desc;

grant select on public.active_project_rooms to authenticated, anon;
