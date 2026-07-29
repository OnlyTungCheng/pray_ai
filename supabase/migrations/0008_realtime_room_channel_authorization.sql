-- Đền Cầu Nguyện — Realtime channel authorization for private room channels.
--
-- Bug: useTempleRoom (client) and actions/route.ts (server) both open the
-- channel with `config: { private: true }`, which requires RLS policies on
-- `realtime.messages` — a separate authorization layer from ordinary table
-- RLS (see https://supabase.com/docs/guides/realtime/authorization).
-- Without these policies, every private channel join is rejected with
-- "Unauthorized: You do not have permissions to read from this Channel topic".
--
-- Our channel topic format is `room:{roomId}` (see use-temple-room.ts and
-- actions/route.ts). We authorize based on room_members: a user may
-- broadcast/presence on a topic only if they've joined that room via
-- POST /api/rooms/[roomId]/join (which inserts into room_members).
--
-- Topic parsing: realtime.topic() returns the full topic string
-- ("room:<uuid>"); we strip the "room:" prefix to get the room_id and cast
-- to uuid for the room_members lookup.

create or replace function public.realtime_room_id_from_topic()
returns uuid
language sql
stable
as $$
  select case
    when (select realtime.topic()) like 'room:%'
      then substring((select realtime.topic()) from 6)::uuid
    else null
  end;
$$;

-- Read access: broadcast + presence (a member of the room can receive both
-- the ritual action broadcasts and everyone's presence updates).
drop policy if exists "room members can receive broadcast and presence" on "realtime"."messages";
create policy "room members can receive broadcast and presence"
on "realtime"."messages"
for select
to authenticated
using (
  exists (
    select 1
    from public.room_members
    where room_members.user_id = (select auth.uid())
      and room_members.room_id = public.realtime_room_id_from_topic()
      and realtime.messages.extension in ('broadcast', 'presence')
  )
);

-- Write access: broadcast + presence. actions/route.ts calls channel.send()
-- using the same per-request server client (the acting user's own session,
-- not a service-role client), so this policy must allow the room member
-- to write — which is correct, since they can only reach that code path
-- after having joined the room via POST /api/rooms/[roomId]/join.
drop policy if exists "room members can send broadcast and presence" on "realtime"."messages";
create policy "room members can send broadcast and presence"
on "realtime"."messages"
for insert
to authenticated
with check (
  exists (
    select 1
    from public.room_members
    where room_members.user_id = (select auth.uid())
      and room_members.room_id = public.realtime_room_id_from_topic()
      and realtime.messages.extension in ('broadcast', 'presence')
  )
);
