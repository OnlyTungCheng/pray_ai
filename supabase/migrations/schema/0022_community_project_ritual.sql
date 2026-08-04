-- Community project ritual: joining a temple is sufficient to contribute.
-- `room_members.role` may remain for future moderation, but it must never
-- gate readiness checks or a shared ritual launch.

drop policy if exists "stewards can write readiness" on public.project_readiness_checks;
drop policy if exists "members can write readiness" on public.project_readiness_checks;
create policy "members can write readiness"
  on public.project_readiness_checks for all to authenticated using (
    exists (
      select 1 from public.room_members m
      where m.room_id = project_readiness_checks.room_id and m.user_id = auth.uid()
    )
  ) with check (
    exists (
      select 1 from public.room_members m
      where m.room_id = project_readiness_checks.room_id and m.user_id = auth.uid()
    )
  );

drop policy if exists "stewards can create ritual runs" on public.project_ritual_runs;
drop policy if exists "members can create ritual runs" on public.project_ritual_runs;
create policy "members can create ritual runs"
  on public.project_ritual_runs for insert to authenticated with check (
    initiated_by = auth.uid() and exists (
      select 1 from public.room_members m
      where m.room_id = project_ritual_runs.room_id and m.user_id = auth.uid()
    )
  );

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
  ) then
    raise exception 'NOT_A_ROOM_MEMBER';
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
