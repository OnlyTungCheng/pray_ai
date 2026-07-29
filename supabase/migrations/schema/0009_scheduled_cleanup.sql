-- Đền Cầu Nguyện — scheduled cleanup for ephemeral data.
--
-- api_rate_limits (migration 0006) and room_actions (migration 0001) both
-- grow unbounded over time and are only ever queried for *recent* rows
-- (sliding-window rate checks, wish-wall/incense history for the last N
-- items) — old rows are pure dead weight. Schedule periodic deletes via
-- Supabase Cron (pg_cron under the hood) instead of relying on someone to
-- run cleanup_old_rate_limit_entries() manually.

create extension if not exists pg_cron;

-- ============================================================================
-- room_actions cleanup
-- ============================================================================
-- room_actions also backs idempotency (eventId as primary key) and the
-- 250ms-cooldown check (check_room_action_rate_limit), both of which only
-- ever look at very recent rows — 7 days is generous headroom for either
-- of those to still see relevant history while keeping the table bounded.
create or replace function public.cleanup_old_room_actions()
returns void
language sql
as $$
  delete from public.room_actions where created_at < now() - interval '7 days';
$$;

revoke all on function public.cleanup_old_room_actions() from public;

-- ============================================================================
-- Schedule both cleanups to run nightly at 03:00 UTC (low-traffic window).
-- ============================================================================
-- cron.schedule() overwrites a job with the same name if one already exists,
-- so this migration is safe to re-run.
select cron.schedule(
  'cleanup-old-rate-limit-entries',
  '0 3 * * *',
  $$ select public.cleanup_old_rate_limit_entries(); $$
);

select cron.schedule(
  'cleanup-old-room-actions',
  '0 3 * * *',
  $$ select public.cleanup_old_room_actions(); $$
);
