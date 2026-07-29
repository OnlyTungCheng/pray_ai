-- Đền Cầu Nguyện — allow anonymous (pre-auth) read access to rooms.
--
-- Bug found: the homepage (`/`) is a Server Component that fetches the
-- system lobby room and active rooms list BEFORE any client-side anonymous
-- sign-in has happened (ensureAnonymousUser only runs inside client
-- components rendered after the initial server fetch). That first request
-- runs as Postgres role `anon`, but migration 0001's SELECT policy on
-- `rooms` only granted `to authenticated` — so RLS silently returned zero
-- rows, even though the seeded lobby room existed, making the homepage show
-- "Sảnh chung chưa được khởi tạo" incorrectly.
--
-- Fix: allow `anon` to read `rooms` (and the two views built on top of it).
-- This matches the product doc's explicit anonymous-first intent — visitors
-- should be able to see the temple lobby and active project rooms without
-- having signed in yet. Write access (insert/update) remains restricted to
-- `authenticated`, so this does not weaken write security at all.

drop policy if exists "rooms are readable by any authenticated user" on public.rooms;
drop policy if exists "rooms are readable by anyone, including anonymous visitors" on public.rooms;
create policy "rooms are readable by anyone, including anonymous visitors"
  on public.rooms for select
  to anon, authenticated
  using (true);

grant select on public.rooms to anon;

-- The active_project_rooms / project_top_rank views were granted to
-- `authenticated` only in migration 0005 — extend to `anon` for the same reason.
grant select on public.active_project_rooms to anon;
grant select on public.project_top_rank to anon;

-- /oracle/[resultId] is the same story: a shared oracle result link must be
-- viewable by whoever opens it, even if they've never visited this site
-- before and have no session yet.
drop policy if exists "oracle results are readable by any authenticated user" on public.oracle_results;
drop policy if exists "oracle results are readable by anyone, including anonymous visitors" on public.oracle_results;
create policy "oracle results are readable by anyone, including anonymous visitors"
  on public.oracle_results for select
  to anon, authenticated
  using (true);

grant select on public.oracle_results to anon;
