-- Đền Cầu Nguyện — core schema for temple rooms, membership, and realtime actions.
--
-- Column names/shapes here are derived directly from the existing route handlers
-- (src/app/api/rooms/[roomId]/join, src/app/api/rooms/[roomId]/actions) and the
-- product doc's TempleRoom server-state type. Run this against a Supabase
-- Postgres project (SQL editor or `supabase db push`) before wiring real
-- credentials into .env.local.

-- ============================================================================
-- rooms
-- ============================================================================
create table if not exists public.rooms (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,

  -- From the doc's /pray flow: "Tên dự án", "Sự kiện", "Lời cầu".
  project_name text not null,
  event_type text not null check (
    event_type in ('build', 'deploy', 'migration', 'release')
  ),
  prayer text not null,

  -- Human-friendly room title/description shown in the UI (join/route.ts selects these).
  title text not null,
  description text,

  status text not null default 'waiting' check (
    status in ('waiting', 'praying', 'completed')
  ),

  -- Collective ritual counters (doc's "🔥 24 nén hương / 🔔 63 tiếng chuông / ⚡ Linh lực deploy: 87%").
  incense_count integer not null default 0,
  bell_count integer not null default 0,
  prayer_count integer not null default 0,
  energy integer not null default 0 check (energy between 0 and 100),

  -- Optimistic-concurrency guard; realtime clients ignore snapshots with a
  -- revision <= what they already have (see use-temple-room.ts).
  revision integer not null default 0,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  -- Rooms are ephemeral by design (doc explicitly avoids long-lived dashboards).
  expires_at timestamptz not null default (now() + interval '24 hours')
);

create index if not exists rooms_slug_idx on public.rooms (slug);
create index if not exists rooms_expires_at_idx on public.rooms (expires_at);

-- ============================================================================
-- room_members
-- ============================================================================
create table if not exists public.room_members (
  room_id uuid not null references public.rooms (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  display_name text not null,
  joined_at timestamptz not null default now(),

  primary key (room_id, user_id)
);

-- join/route.ts upserts with onConflict: "room_id,user_id" — the primary key above
-- already provides this constraint, so no separate unique index is needed.

-- ============================================================================
-- room_actions
-- ============================================================================
create table if not exists public.room_actions (
  -- Client-generated eventId (crypto.randomUUID()) doubles as the primary key,
  -- which is what makes the duplicate-insert (Postgres 23505) idempotency check
  -- in actions/route.ts work.
  id uuid primary key,
  room_id uuid not null references public.rooms (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,

  action_type text not null check (
    action_type in (
      'light_incense',
      'ring_bell',
      'start_praying',
      'finish_praying',
      'reaction',
      'clear_incense'
    )
  ),

  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists room_actions_room_id_idx on public.room_actions (room_id);
create index if not exists room_actions_created_at_idx on public.room_actions (created_at);

-- ============================================================================
-- oracle_results
-- ============================================================================
-- Persists drawn "quẻ deploy" results so /oracle/[resultId] can be visited
-- and shared later (doc: "Chia sẻ kết quả cho đồng đội"). The draw logic itself
-- (src/features/oracle) is pure and does not require this table to function,
-- but persisting results is what makes the share-link route work.
create table if not exists public.oracle_results (
  id uuid primary key,
  room_id uuid references public.rooms (id) on delete set null,
  user_id uuid references auth.users (id) on delete set null,

  tier text not null check (
    tier in ('dai_cat', 'cat', 'binh', 'hung', 'dai_hung')
  ),
  event_type text not null check (
    event_type in (
      'build', 'deploy', 'migration', 'release',
      'friday_night_bug', 'requirement_change',
      'pr_review', 'server_crash', 'rollback'
    )
  ),
  message text not null,

  created_at timestamptz not null default now()
);

create index if not exists oracle_results_room_id_idx on public.oracle_results (room_id);

-- ============================================================================
-- updated_at maintenance
-- ============================================================================
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists rooms_set_updated_at on public.rooms;
create trigger rooms_set_updated_at
  before update on public.rooms
  for each row
  execute function public.set_updated_at();

-- ============================================================================
-- Row Level Security
-- ============================================================================
-- Anonymous-first per the doc ("Không nhất thiết bắt người dùng đăng nhập"),
-- but every request still goes through Supabase anonymous auth
-- (ensureAnonymousUser), so policies key off auth.uid() rather than allowing
-- fully unauthenticated access.

alter table public.rooms enable row level security;
alter table public.room_members enable row level security;
alter table public.room_actions enable row level security;
alter table public.oracle_results enable row level security;

drop policy if exists "rooms are readable by any authenticated user" on public.rooms;
create policy "rooms are readable by any authenticated user"
  on public.rooms for select
  to authenticated
  using (true);

drop policy if exists "rooms are insertable by any authenticated user" on public.rooms;
create policy "rooms are insertable by any authenticated user"
  on public.rooms for insert
  to authenticated
  with check (true);

drop policy if exists "room members can read their room roster" on public.room_members;
create policy "room members can read their room roster"
  on public.room_members for select
  to authenticated
  using (true);

drop policy if exists "authenticated users can join a room" on public.room_members;
create policy "authenticated users can join a room"
  on public.room_members for insert
  to authenticated
  with check (auth.uid() = user_id);

drop policy if exists "authenticated users can update their own membership" on public.room_members;
create policy "authenticated users can update their own membership"
  on public.room_members for update
  to authenticated
  using (auth.uid() = user_id);

drop policy if exists "room actions are readable by any authenticated user" on public.room_actions;
create policy "room actions are readable by any authenticated user"
  on public.room_actions for select
  to authenticated
  using (true);

drop policy if exists "authenticated users can record their own actions" on public.room_actions;
create policy "authenticated users can record their own actions"
  on public.room_actions for insert
  to authenticated
  with check (auth.uid() = user_id);

drop policy if exists "oracle results are readable by any authenticated user" on public.oracle_results;
create policy "oracle results are readable by any authenticated user"
  on public.oracle_results for select
  to authenticated
  using (true);

drop policy if exists "authenticated users can save their own oracle result" on public.oracle_results;
create policy "authenticated users can save their own oracle result"
  on public.oracle_results for insert
  to authenticated
  with check (auth.uid() = user_id or user_id is null);
