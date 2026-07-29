-- Đền Cầu Nguyện — active rooms list + Top Rank aggregation.
--
-- PRD 3.2:
-- "Danh sách phòng dự án": các phòng đang hoạt động (chưa hết hạn, khác sảnh chung).
-- "Top Rank dự án": tổng hợp theo project_name (một dự án có thể có nhiều room
-- theo thời gian, nên rank theo project_name, không theo room_id đơn lẻ).

-- ============================================================================
-- Active project rooms (excludes the permanent system lobby)
-- ============================================================================
-- Explicit DROP + CREATE, not CREATE OR REPLACE: a later migration
-- (schema/0011_offering_counter.sql) appends an offering_count column to
-- this same view. `create or replace view` refuses to change a view's
-- output columns, so if this file is ever re-run *after* 0011 (both are
-- idempotent and meant to be safely re-runnable in any order — see
-- docs/backend.md §3), a plain `create or replace` here would fail with
-- "cannot drop columns from view". Dropping first avoids that entirely.
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
  expires_at
from public.rooms
where slug <> 'sanh-chung'
  and expires_at > now()
order by created_at desc;

grant select on public.active_project_rooms to authenticated;

-- ============================================================================
-- Top Rank by project (aggregated across all rooms ever created for that project)
-- ============================================================================
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
  -- "Linh lực tích luỹ" — average energy across the project's rooms, so a
  -- project with many small rooms doesn't automatically outrank one with a
  -- single highly-active room purely by room count.
  round(avg(energy)) as avg_energy,
  max(created_at) as last_activity_at
from public.rooms
where slug <> 'sanh-chung'
group by project_name
order by sum(incense_count) + sum(bell_count) + sum(prayer_count) desc;

grant select on public.project_top_rank to authenticated;
