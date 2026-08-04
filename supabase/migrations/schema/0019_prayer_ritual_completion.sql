-- Prayer Ritual Completion: one transactional finish, Oracle and audit row.
-- The client event id is the idempotency key. A retry returns the original
-- Oracle result instead of incrementing counters or drawing again.
create table if not exists public.prayer_ritual_completions (
  action_id uuid primary key references public.room_actions(id) on delete cascade,
  room_id uuid not null references public.rooms(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  oracle_result_id uuid not null unique references public.oracle_results(id) on delete restrict,
  created_at timestamptz not null default now()
);

create index if not exists prayer_ritual_completions_room_created_idx
  on public.prayer_ritual_completions(room_id, created_at desc);

alter table public.prayer_ritual_completions enable row level security;

create policy "members can read prayer completions"
  on public.prayer_ritual_completions for select to authenticated
  using (exists (
    select 1 from public.room_members m
    where m.room_id = prayer_ritual_completions.room_id and m.user_id = auth.uid()
  ));

create policy "users can create their prayer completions"
  on public.prayer_ritual_completions for insert to authenticated
  with check (user_id = auth.uid());

create or replace function public.complete_prayer_ritual(
  p_room_id uuid,
  p_user_id uuid,
  p_event_id uuid,
  p_payload jsonb,
  p_oracle_id uuid,
  p_oracle_tier text,
  p_event_type text,
  p_message text
)
returns jsonb
language plpgsql
security invoker
as $$
declare
  v_existing public.prayer_ritual_completions;
  v_action public.room_actions;
  v_room public.rooms;
  v_oracle public.oracle_results;
begin
  if p_user_id <> auth.uid() then
    raise exception 'PRAYER_USER_MISMATCH';
  end if;

  if not exists (
    select 1 from public.room_members m
    where m.room_id = p_room_id and m.user_id = p_user_id
  ) then
    raise exception 'NOT_A_ROOM_MEMBER';
  end if;

  select * into v_existing
  from public.prayer_ritual_completions
  where action_id = p_event_id;

  if found then
    select * into v_room from public.rooms where id = v_existing.room_id;
    select * into v_oracle from public.oracle_results where id = v_existing.oracle_result_id;
    return jsonb_build_object(
      'accepted', true,
      'duplicated', true,
      'room', to_jsonb(v_room),
      'result', to_jsonb(v_oracle)
    );
  end if;

  insert into public.room_actions(id, room_id, user_id, action_type, payload)
  values (p_event_id, p_room_id, p_user_id, 'finish_praying', coalesce(p_payload, '{}'::jsonb))
  on conflict (id) do nothing
  returning * into v_action;

  if v_action.id is null then
    select * into v_existing from public.prayer_ritual_completions where action_id = p_event_id;
    if v_existing.action_id is null then
      raise exception 'PRAYER_EVENT_ALREADY_USED';
    end if;
  end if;

  insert into public.oracle_results(id, room_id, user_id, tier, event_type, message)
  values (p_oracle_id, p_room_id, p_user_id, p_oracle_tier, p_event_type, p_message)
  returning * into v_oracle;

  update public.rooms
  set prayer_count = prayer_count + 1,
      energy = greatest(0, least(100, energy + 5)),
      revision = revision + 1
  where id = p_room_id
  returning * into v_room;

  if v_room.id is null then
    raise exception 'ROOM_NOT_FOUND: %', p_room_id;
  end if;

  insert into public.prayer_ritual_completions(action_id, room_id, user_id, oracle_result_id)
  values (p_event_id, p_room_id, p_user_id, p_oracle_id);

  return jsonb_build_object(
    'accepted', true,
    'duplicated', false,
    'room', to_jsonb(v_room),
    'result', to_jsonb(v_oracle)
  );
end;
$$;

revoke all on function public.complete_prayer_ritual(uuid, uuid, uuid, jsonb, uuid, text, text, text) from public;
grant execute on function public.complete_prayer_ritual(uuid, uuid, uuid, jsonb, uuid, text, text, text) to authenticated;
