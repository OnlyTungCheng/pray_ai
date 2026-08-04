-- Release authority for readiness mutation and launch.
alter table public.room_members
  add column if not exists role text not null default 'participant';

alter table public.room_members
  drop constraint if exists room_members_role_check;

alter table public.room_members
  add constraint room_members_role_check check (role in ('owner', 'maintainer', 'participant'));

create index if not exists room_members_room_role_idx on public.room_members(room_id, role);

drop policy if exists "members can write readiness" on public.project_readiness_checks;
create policy "stewards can write readiness"
  on public.project_readiness_checks for all to authenticated using (
    exists (
      select 1 from public.room_members m
      where m.room_id = project_readiness_checks.room_id
        and m.user_id = auth.uid()
        and m.role in ('owner', 'maintainer')
    )
  ) with check (
    exists (
      select 1 from public.room_members m
      where m.room_id = project_readiness_checks.room_id
        and m.user_id = auth.uid()
        and m.role in ('owner', 'maintainer')
    )
  );

drop policy if exists "members can create ritual runs" on public.project_ritual_runs;
create policy "stewards can create ritual runs"
  on public.project_ritual_runs for insert to authenticated with check (
    initiated_by = auth.uid() and exists (
      select 1 from public.room_members m
      where m.room_id = project_ritual_runs.room_id
        and m.user_id = auth.uid()
        and m.role in ('owner', 'maintainer')
    )
  );

create or replace function public.set_room_member_role(
  p_room_id uuid,
  p_member_id uuid,
  p_role text
)
returns void
language plpgsql
security invoker
as $$
begin
  if p_role not in ('owner', 'maintainer', 'participant') then
    raise exception 'INVALID_ROOM_ROLE';
  end if;

  if not exists (
    select 1 from public.room_members m
    where m.room_id = p_room_id and m.user_id = auth.uid() and m.role = 'owner'
  ) then
    raise exception 'NOT_ROOM_OWNER';
  end if;

  update public.room_members set role = p_role
  where room_id = p_room_id and user_id = p_member_id;
end;
$$;

revoke all on function public.set_room_member_role(uuid, uuid, text) from public;
grant execute on function public.set_room_member_role(uuid, uuid, text) to authenticated;
