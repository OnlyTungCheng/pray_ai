-- Make the shared "Dọn bát hương" action durable, so cleared sticks do not
-- return when another participant reconnects or reloads the room.
alter table public.room_actions
  drop constraint if exists room_actions_action_type_check;

alter table public.room_actions
  add constraint room_actions_action_type_check check (
    action_type in (
      'light_incense',
      'ring_bell',
      'start_praying',
      'finish_praying',
      'reaction',
      'clear_incense'
    )
  );
