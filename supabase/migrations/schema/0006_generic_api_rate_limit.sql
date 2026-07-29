-- Đền Cầu Nguyện — generic per-endpoint API rate limiting.
--
-- User request: "thêm rate limit dành cho các đầu api, khoảng 10 20 lần thôi"
-- i.e. every API endpoint (not just room actions) should reject a user after
-- roughly 10-20 requests in a short window. This is separate from and
-- complementary to check_room_action_rate_limit (migration 0003), which only
-- guards the 250ms-between-clicks case for room_actions specifically.
--
-- Approach: a single small table logging one row per request attempt, keyed
-- by (user_id, endpoint), with a sliding-window COUNT query. No Redis/Upstash
-- needed — consistent with the product doc's "đừng làm quá sớm" guidance and
-- with how check_room_action_rate_limit already does things in Postgres.

create table if not exists public.api_rate_limits (
  id bigint generated always as identity primary key,
  user_id uuid not null references auth.users (id) on delete cascade,
  endpoint text not null,
  created_at timestamptz not null default now()
);

-- Sliding-window lookups filter by (user_id, endpoint, created_at) — this
-- index makes both the COUNT in check_rate_limit and the periodic cleanup
-- below fast even as the table grows.
create index if not exists api_rate_limits_user_endpoint_created_idx
  on public.api_rate_limits (user_id, endpoint, created_at desc);

alter table public.api_rate_limits enable row level security;

drop policy if exists "users can insert their own rate limit entries" on public.api_rate_limits;
create policy "users can insert their own rate limit entries"
  on public.api_rate_limits for insert
  to authenticated
  with check (auth.uid() = user_id);

drop policy if exists "users can read their own rate limit entries" on public.api_rate_limits;
create policy "users can read their own rate limit entries"
  on public.api_rate_limits for select
  to authenticated
  using (auth.uid() = user_id);

-- ============================================================================
-- check_rate_limit(p_user_id, p_endpoint, p_max_requests, p_window_seconds)
-- ============================================================================
-- Atomically records this request attempt and reports whether the caller is
-- still within the allowed rate for that endpoint. Recording happens
-- regardless of the outcome, so a client can't dodge the limit by only
-- counting "successful" calls.
create or replace function public.check_rate_limit(
  p_user_id uuid,
  p_endpoint text,
  p_max_requests integer default 15,
  p_window_seconds integer default 60
)
returns boolean
language plpgsql
as $$
declare
  v_window_start timestamptz := now() - (p_window_seconds || ' seconds')::interval;
  v_request_count integer;
begin
  insert into public.api_rate_limits (user_id, endpoint)
  values (p_user_id, p_endpoint);

  select count(*) into v_request_count
  from public.api_rate_limits
  where user_id = p_user_id
    and endpoint = p_endpoint
    and created_at >= v_window_start;

  return v_request_count <= p_max_requests;
end;
$$;

revoke all on function public.check_rate_limit(uuid, text, integer, integer) from public;
grant execute on function public.check_rate_limit(uuid, text, integer, integer) to authenticated;

-- ============================================================================
-- Housekeeping: drop rate-limit rows older than any window we'd reasonably use.
-- ============================================================================
-- Not scheduled automatically (would need pg_cron, which is extra infra this
-- project doesn't need yet) — safe to run manually/periodically, or wire to a
-- pg_cron job later if the table grows large enough to matter.
create or replace function public.cleanup_old_rate_limit_entries()
returns void
language sql
as $$
  delete from public.api_rate_limits where created_at < now() - interval '1 day';
$$;

revoke all on function public.cleanup_old_rate_limit_entries() from public;
