-- Đền Cầu Nguyện — Hall (Điện) / Deity (Thần) system.
--
-- Per docs/than.md: each "Điện" (Hall) is a ritual space grouping a family of
-- related dev tools, hosting 1-3 "Thần" (Deity), each representing one tool.
-- A "Dự án cầu nguyện" (project prayer room — the existing `rooms` table) now
-- optionally belongs to a Hall and picks one primary deity + up to 2 support
-- deities from that Hall's roster.
--
-- MVP scope deliberately narrower than the full than.md brainstorm: no new
-- multi-currency energy system (reuses rooms.energy), no explicit 5-phase
-- state machine (reuses rooms.status), only 3 halls seeded (see
-- seed/0002_seed_halls_and_deities.sql) instead of the doc's 6.

-- ============================================================================
-- halls (Điện)
-- ============================================================================
create table if not exists public.halls (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  description text,
  -- Display ordering on a future hall-picker UI; not currently used by any
  -- query but cheap to have from day one rather than retrofitting later.
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

-- ============================================================================
-- deities (Thần)
-- ============================================================================
create table if not exists public.deities (
  id uuid primary key default gen_random_uuid(),
  hall_id uuid not null references public.halls (id) on delete cascade,
  slug text not null,
  name text not null,
  -- e.g. "Vercel" — the actual tool this deity represents, kept separate
  -- from the display `name` (which may be more flavorful, e.g. "Thần Vercel").
  tool_name text not null,
  description text,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),

  unique (hall_id, slug)
);

create index if not exists deities_hall_id_idx on public.deities (hall_id);

-- ============================================================================
-- rooms: link to hall + deities
-- ============================================================================
alter table public.rooms
  add column if not exists hall_id uuid references public.halls (id) on delete set null,
  add column if not exists primary_deity_id uuid references public.deities (id) on delete set null,
  add column if not exists support_deity_ids uuid[] not null default '{}'::uuid[];

-- Nullable by design: the system lobby room (seed/0001) predates this
-- feature and has no hall — it represents the whole temple, not one toolchain.

-- than.md: "tối đa 2 hộ thần" (at most 2 support deities).
alter table public.rooms
  drop constraint if exists rooms_support_deity_ids_max_two;
alter table public.rooms
  add constraint rooms_support_deity_ids_max_two
  check (array_length(support_deity_ids, 1) is null or array_length(support_deity_ids, 1) <= 2);

-- ============================================================================
-- consistency: primary/support deities must belong to the room's hall
-- ============================================================================
-- Enforced via trigger rather than a plain CHECK constraint, because the
-- rule spans two tables (rooms.hall_id vs deities.hall_id) — Postgres CHECK
-- constraints cannot reference other tables.
create or replace function public.check_room_deities_belong_to_hall()
returns trigger
language plpgsql
as $$
declare
  bad_deity_id uuid;
begin
  if new.hall_id is null then
    if new.primary_deity_id is not null or coalesce(array_length(new.support_deity_ids, 1), 0) > 0 then
      raise exception 'A room with no hall_id cannot have a primary or support deity';
    end if;
    return new;
  end if;

  if new.primary_deity_id is not null then
    if not exists (
      select 1 from public.deities d
      where d.id = new.primary_deity_id and d.hall_id = new.hall_id
    ) then
      raise exception 'primary_deity_id % does not belong to hall %', new.primary_deity_id, new.hall_id;
    end if;
  end if;

  if new.support_deity_ids is not null and array_length(new.support_deity_ids, 1) > 0 then
    select sd.id into bad_deity_id
    from unnest(new.support_deity_ids) as sd(id)
    left join public.deities d on d.id = sd.id and d.hall_id = new.hall_id
    where d.id is null
    limit 1;

    if bad_deity_id is not null then
      raise exception 'support_deity_ids contains a deity (%) not belonging to hall %', bad_deity_id, new.hall_id;
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
-- Row Level Security — halls/deities are a read-only public catalog.
-- ============================================================================
-- No insert/update/delete policy is created for either table: only
-- migrations (running with the Postgres owner role, which bypasses RLS)
-- can write to them. Clients — anon or authenticated — can only ever read.

alter table public.halls enable row level security;
alter table public.deities enable row level security;

drop policy if exists "halls are readable by anyone" on public.halls;
create policy "halls are readable by anyone"
  on public.halls for select
  to anon, authenticated
  using (true);

drop policy if exists "deities are readable by anyone" on public.deities;
create policy "deities are readable by anyone"
  on public.deities for select
  to anon, authenticated
  using (true);

-- ============================================================================
-- active_project_rooms view: surface hall_id/primary_deity_id
-- ============================================================================
-- Same drop-view-then-create-view idempotency pattern established in
-- schema/0011_offering_counter.sql: `create or replace view` refuses to
-- change a view's output columns, so appending new columns requires an
-- explicit drop first. Columns appended at the end, not inserted in the
-- middle, for the same reason (see docs/backend.md §7).
--
-- Also fixes a real regression discovered while writing this migration:
-- `0007_allow_anon_read_rooms.sql` granted anon SELECT on this view, but
-- `0011_offering_counter.sql` re-created the view (drop+create, required by
-- the column-append rule above) and only re-granted `authenticated`, not
-- `anon` — a GRANT is attached to the view object itself, so dropping the
-- view drops the grant too. Every migration from here on that drops+recreates
-- this view must re-grant BOTH roles, or anon read access silently regresses
-- again. Granting both here restores it.
drop view if exists public.active_project_rooms;
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
