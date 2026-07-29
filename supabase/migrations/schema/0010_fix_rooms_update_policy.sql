-- Đền Cầu Nguyện — fix missing UPDATE policy on rooms.
--
-- Bug: migration 0001 enabled RLS on `rooms` and added SELECT/INSERT
-- policies, but never added an UPDATE policy. With RLS enabled, having zero
-- policies for a given command means that command is fully denied — not
-- "allowed by default". apply_room_action() (migration 0002) is NOT
-- `security definer`, so it runs as the calling `authenticated` role, and
-- its internal `UPDATE public.rooms ...` was silently matching zero rows
-- under RLS. That made `v_room.id is null` true, which raises
-- `ROOM_NOT_FOUND`, which surfaces to the client as `ROOM_UPDATE_FAILED`
-- even when the room genuinely exists.
--
-- Fix: allow any authenticated user who is a member of a room (has joined
-- via POST /api/rooms/[roomId]/join, i.e. has a row in room_members) to
-- UPDATE that room. This is intentionally scoped to room membership rather
-- than opened up entirely — a user should not be able to update a room
-- they've never joined.
--
-- Note: this does not change *what* can be updated (column-level control),
-- only *who* can issue the UPDATE. The actual delta logic is still fully
-- controlled by apply_room_action()'s fixed CASE statement — there is no
-- route or client path that lets a user set arbitrary column values
-- directly via PostgREST.

drop policy if exists "room members can update their room" on public.rooms;
create policy "room members can update their room"
  on public.rooms for update
  to authenticated
  using (
    exists (
      select 1
      from public.room_members
      where room_members.room_id = rooms.id
        and room_members.user_id = (select auth.uid())
    )
  )
  with check (
    exists (
      select 1
      from public.room_members
      where room_members.room_id = rooms.id
        and room_members.user_id = (select auth.uid())
    )
  );
