-- Project Success Ritual launch transaction and idempotency.
create or replace function public.launch_project_ritual(
  p_run_id uuid,
  p_room_id uuid,
  p_user_id uuid,
  p_readiness_score integer,
  p_readiness_snapshot jsonb,
  p_risk_accepted boolean,
  p_note text,
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
  v_run public.project_ritual_runs;
  v_oracle public.oracle_results;
begin
  if p_user_id <> auth.uid() then
    raise exception 'RITUAL_USER_MISMATCH';
  end if;

  if not exists (
    select 1 from public.room_members m
    where m.room_id = p_room_id and m.user_id = p_user_id
      and m.role in ('owner', 'maintainer')
  ) then
    raise exception 'NOT_RELEASE_STEWARD';
  end if;

  select * into v_run from public.project_ritual_runs where id = p_run_id;
  if found then
    select * into v_oracle from public.oracle_results where id = v_run.oracle_result_id;
    return jsonb_build_object('run', to_jsonb(v_run), 'result', to_jsonb(v_oracle));
  end if;

  insert into public.oracle_results(id, room_id, user_id, tier, event_type, message)
  values (p_oracle_id, p_room_id, p_user_id, p_oracle_tier, p_event_type, p_message)
  returning * into v_oracle;

  insert into public.project_ritual_runs(
    id, room_id, initiated_by, readiness_score, readiness_snapshot,
    risk_accepted, note, oracle_result_id
  )
  values (
    p_run_id, p_room_id, p_user_id, p_readiness_score, p_readiness_snapshot,
    p_risk_accepted, p_note, p_oracle_id
  )
  returning * into v_run;

  return jsonb_build_object('run', to_jsonb(v_run), 'result', to_jsonb(v_oracle));
end;
$$;

revoke all on function public.launch_project_ritual(uuid, uuid, uuid, integer, jsonb, boolean, text, uuid, text, text, text) from public;
grant execute on function public.launch_project_ritual(uuid, uuid, uuid, integer, jsonb, boolean, text, uuid, text, text, text) to authenticated;
