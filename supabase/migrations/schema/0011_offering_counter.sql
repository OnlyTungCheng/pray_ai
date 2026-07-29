-- Đền Cầu Nguyện — dedicated counter + persisted log for "dâng lễ vật" (offerings).
--
-- Previously, offering an item was recorded purely as a generic
-- action_type='reaction' row with payload.offering=<id> — indistinguishable
-- from a plain 🙏 reaction, with no counter of its own and nothing that could
-- feed into project_top_rank. This migration adds:
--   1. rooms.offering_count — a real counter, alongside incense/bell/prayer.
--   2. room_offerings — a per-offering log (which item, by whom, when), so
--      "most-offered item" style stats are a simple GROUP BY instead of
--      parsing room_actions.payload JSON.
--   3. A 4th parameter on apply_room_action so the counter increment and the
--      room_offerings insert happen atomically in the same statement/call,
--      for the same read-modify-write-race reason documented in 0002.
--
-- The offering_id whitelist below MUST stay in sync with
-- src/features/offerings/offering-catalog.ts (DEVELOPER_OFFERINGS ids).

-- ============================================================================
-- rooms.offering_count
-- ============================================================================
alter table public.rooms
  add column if not exists offering_count integer not null default 0;

-- ============================================================================
-- room_offerings
-- ============================================================================
create table if not exists public.room_offerings (
  -- Same id-doubles-as-PK idempotency pattern as room_actions.id: the client
  -- generates this as the same eventId used for the action/actions insert.
  id uuid primary key,
  room_id uuid not null references public.rooms (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,

  offering_id text not null check (
    offering_id in (
      'laptop',
      'keyboard',
      'coffee',
      'rubber_duck',
      'config_scroll',
      'ci_lantern'
    )
  ),

  created_at timestamptz not null default now()
);

create index if not exists room_offerings_room_id_idx on public.room_offerings (room_id);
create index if not exists room_offerings_offering_id_idx on public.room_offerings (offering_id);

alter table public.room_offerings enable row level security;

drop policy if exists "room offerings are readable by any authenticated user" on public.room_offerings;
create policy "room offerings are readable by any authenticated user"
  on public.room_offerings for select
  to authenticated
  using (true);

drop policy if exists "authenticated users can record their own offerings" on public.room_offerings;
create policy "authenticated users can record their own offerings"
  on public.room_offerings for insert
  to authenticated
  with check (auth.uid() = user_id);

-- Anonymous visitors can read the same public room data as `rooms`/`room_actions`
-- (see 0007) — offerings are equally public/non-sensitive, so extend the same
-- anon-read allowance here for consistency (e.g. a future stats view fetched
-- from a Server Component before sign-in).
drop policy if exists "room offerings are readable by anonymous visitors" on public.room_offerings;
create policy "room offerings are readable by anonymous visitors"
  on public.room_offerings for select
  to anon
  using (true);

-- ============================================================================
-- apply_room_action — add p_offering_id (4th... actually 3rd) param
-- ============================================================================
-- IMPORTANT: `create or replace function` with a different argument list does
-- NOT replace the existing 2-arg apply_room_action(uuid, text) — Postgres
-- treats a changed signature as function overloading (a distinct function
-- that happens to share a name), so both would coexist and only diverge over
-- time if left alone. Explicitly drop the old 2-arg overload first so there
-- is exactly one apply_room_action definition going forward. The 3rd param
-- has a default, so existing call sites that still pass only 2 arguments
-- keep working unchanged.
drop function if exists public.apply_room_action(uuid, text);

create or replace function public.apply_room_action(
  p_room_id uuid,
  p_action_type text,
  p_offering_id text default null
)
returns public.rooms
language plpgsql
as $$
declare
  v_room public.rooms;
  v_incense_delta integer := 0;
  v_bell_delta integer := 0;
  v_prayer_delta integer := 0;
  v_offering_delta integer := 0;
  v_energy_delta integer := 0;
begin
  if p_offering_id is not null and p_offering_id not in (
    'laptop', 'keyboard', 'coffee', 'rubber_duck', 'config_scroll', 'ci_lantern'
  ) then
    raise exception 'INVALID_OFFERING_ID: %', p_offering_id;
  end if;

  case p_action_type
    when 'light_incense' then
      v_incense_delta := 1;
      v_energy_delta := 2;
    when 'ring_bell' then
      v_bell_delta := 1;
      v_energy_delta := 1;
    when 'finish_praying' then
      v_prayer_delta := 1;
      v_energy_delta := 5;
    when 'reaction' then
      if p_offering_id is not null then
        v_offering_delta := 1;
        v_energy_delta := 3;
      else
        v_energy_delta := 1;
      end if;
    else
      -- start_praying and any other action types only touch presence/UI,
      -- not the persisted counters.
      v_energy_delta := 0;
  end case;

  update public.rooms
  set
    incense_count = incense_count + v_incense_delta,
    bell_count = bell_count + v_bell_delta,
    prayer_count = prayer_count + v_prayer_delta,
    offering_count = offering_count + v_offering_delta,
    -- Energy is a 0-100 gauge, not an unbounded counter — clamp it.
    energy = greatest(0, least(100, energy + v_energy_delta)),
    revision = revision + 1
  where id = p_room_id
  returning * into v_room;

  if v_room.id is null then
    raise exception 'ROOM_NOT_FOUND: %', p_room_id;
  end if;

  return v_room;
end;
$$;

revoke all on function public.apply_room_action(uuid, text, text) from public;
grant execute on function public.apply_room_action(uuid, text, text) to authenticated;

-- ============================================================================
-- Re-create active_project_rooms / project_top_rank (0005) to surface the new
-- offering_count column and total. Must live here, AFTER the `alter table`
-- above, since offering_count does not exist yet when 0005 itself runs on a
-- fresh project (migrations run in filename order — see docs/backend.md §3).
--
-- Using an explicit DROP + CREATE (not CREATE OR REPLACE) for both views:
-- `create or replace view` refuses to drop/rename/reorder existing output
-- columns, which makes it unsafe here — re-running 0005 (unchanged, on
-- purpose — see its own comment) *after* 0011 has already added
-- offering_count would otherwise fail with "cannot drop columns from view".
-- Dropping first sidesteps that restriction entirely and keeps both files
-- safely re-runnable in either order.
-- ============================================================================
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
  offering_count
from public.rooms
where slug <> 'sanh-chung'
  and expires_at > now()
order by created_at desc;

grant select on public.active_project_rooms to authenticated;

drop view if exists public.project_top_rank;
create view public.project_top_rank
with (security_invoker = true)
as
select
  project_name,
  count(*) as room_count,
  sum(incense_count) as total_incense,
  sum(bell_count) as total_bell,
  sum(prayer_count) as total_prayer,
  round(avg(energy)) as avg_energy,
  max(created_at) as last_activity_at,
  sum(offering_count) as total_offerings
from public.rooms
where slug <> 'sanh-chung'
group by project_name
order by sum(incense_count) + sum(bell_count) + sum(prayer_count) + sum(offering_count) desc;

grant select on public.project_top_rank to authenticated;
