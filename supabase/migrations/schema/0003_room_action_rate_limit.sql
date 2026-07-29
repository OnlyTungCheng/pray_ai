-- Đền Cầu Nguyện — per-user action cooldown.
--
-- room_actions' primary key (eventId) already prevents double-counting an
-- exact retried request, but it does nothing to stop a client from firing
-- many *distinct* eventIds in rapid succession (bug, or someone holding down
-- the "Gõ chuông" button, or deliberate abuse). Add a minimal per-user,
-- per-room cooldown check — enough to keep counters meaningful in a room with
-- many concurrent developers, without introducing Redis/Upstash or any
-- infrastructure beyond what's already provisioned (per the product doc's
-- explicit "đừng làm quá sớm" guidance).

create or replace function public.check_room_action_rate_limit(
  p_room_id uuid,
  p_user_id uuid,
  p_min_interval_ms integer default 250
)
returns boolean
language plpgsql
as $$
declare
  v_last_action_at timestamptz;
begin
  select created_at into v_last_action_at
  from public.room_actions
  where room_id = p_room_id
    and user_id = p_user_id
  order by created_at desc
  limit 1;

  if v_last_action_at is null then
    return true;
  end if;

  return (extract(epoch from (now() - v_last_action_at)) * 1000) >= p_min_interval_ms;
end;
$$;

revoke all on function public.check_room_action_rate_limit(uuid, uuid, integer) from public;
grant execute on function public.check_room_action_rate_limit(uuid, uuid, integer) to authenticated;

-- Index to keep the per-user recency lookup above fast even as room_actions grows.
create index if not exists room_actions_room_user_created_idx
  on public.room_actions (room_id, user_id, created_at desc);
