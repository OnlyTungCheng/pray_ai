-- Đền Cầu Nguyện — atomic room-counter increments.
--
-- Problem: incrementing incense_count/bell_count/energy/revision by reading the
-- current row in application code and writing back a new value is a classic
-- read-modify-write race. Under concurrent requests (many developers hitting
-- "Thắp hương" at once), some increments get silently lost.
--
-- Fix: a single Postgres function that increments atomically inside the
-- database itself, using `column = column + delta` in one UPDATE statement.
-- Postgres serializes concurrent UPDATEs to the same row via row-level locks,
-- so no increments are lost regardless of how many requests arrive at once.

create or replace function public.apply_room_action(
  p_room_id uuid,
  p_action_type text
)
returns public.rooms
language plpgsql
as $$
declare
  v_room public.rooms;
  v_incense_delta integer := 0;
  v_bell_delta integer := 0;
  v_prayer_delta integer := 0;
  v_energy_delta integer := 0;
begin
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
      v_energy_delta := 1;
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

-- Only authenticated (including anonymous-auth) sessions may call this.
revoke all on function public.apply_room_action(uuid, text) from public;
grant execute on function public.apply_room_action(uuid, text) to authenticated;
