-- Project Success Ritual: persistent, auditable release-readiness state.
create table if not exists public.project_readiness_checks (
  room_id uuid not null references public.rooms(id) on delete cascade,
  check_key text not null check (check_key in ('ci', 'review', 'migration', 'deploy_health')),
  status text not null check (status in ('pass', 'warn', 'fail', 'unknown')) default 'unknown',
  note text,
  source text not null check (source in ('manual', 'github', 'system')) default 'manual',
  updated_by uuid references auth.users(id) on delete set null,
  updated_at timestamptz not null default now(),
  primary key (room_id, check_key)
);

create table if not exists public.project_ritual_runs (
  id uuid primary key,
  room_id uuid not null references public.rooms(id) on delete cascade,
  initiated_by uuid not null references auth.users(id) on delete restrict,
  readiness_score integer not null check (readiness_score between 0 and 100),
  readiness_snapshot jsonb not null,
  risk_accepted boolean not null default false,
  note text,
  oracle_result_id uuid references public.oracle_results(id) on delete set null,
  created_at timestamptz not null default now()
);

create index if not exists project_ritual_runs_room_created_idx on public.project_ritual_runs(room_id, created_at desc);

alter table public.project_readiness_checks enable row level security;
alter table public.project_ritual_runs enable row level security;

create policy "members can read readiness" on public.project_readiness_checks for select to authenticated using (
  exists (select 1 from public.room_members m where m.room_id = project_readiness_checks.room_id and m.user_id = auth.uid())
);
create policy "members can write readiness" on public.project_readiness_checks for all to authenticated using (
  exists (select 1 from public.room_members m where m.room_id = project_readiness_checks.room_id and m.user_id = auth.uid())
) with check (
  exists (select 1 from public.room_members m where m.room_id = project_readiness_checks.room_id and m.user_id = auth.uid())
);
create policy "members can read ritual runs" on public.project_ritual_runs for select to authenticated using (
  exists (select 1 from public.room_members m where m.room_id = project_ritual_runs.room_id and m.user_id = auth.uid())
);
create policy "members can create ritual runs" on public.project_ritual_runs for insert to authenticated with check (
  initiated_by = auth.uid() and exists (select 1 from public.room_members m where m.room_id = project_ritual_runs.room_id and m.user_id = auth.uid())
);
