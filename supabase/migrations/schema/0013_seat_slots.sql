-- Đền Cầu Nguyện — chibi avatar seat slots (docs/prd-chibi-avatar-seats.md).
--
-- Seats are room-scoped (1 user occupies at most 1 slot in 1 room at a time),
-- which maps naturally onto room_members' existing (room_id, user_id) PK —
-- no separate table needed. Slot count is fixed across all rooms for now
-- (see src/features/temple-room/seat-config.ts MAX_SEAT_SLOTS).
--
-- Race-condition handling follows the same principle as apply_room_action
-- (schema/0002): a single conditional UPDATE inside Postgres, relying on row
-- locks to serialize concurrent claims, rather than a client-side
-- read-then-write which would let two users both "win" the same seat.

-- ============================================================================
-- room_members.avatar_id / seat_slot
-- ============================================================================
alter table public.room_members
  add column if not exists avatar_id text,
  add column if not exists seat_slot integer;

-- Whitelist must stay in sync with src/features/avatars/avatar-catalog.ts
-- (CHIBI_AVATARS ids) — same pattern as room_offerings.offering_id (0011).
alter table public.room_members
  drop constraint if exists room_members_avatar_id_check;

alter table public.room_members
  add constraint room_members_avatar_id_check check (
    avatar_id is null or avatar_id in (
      'dev_1', 'dev_2', 'dev_3', 'dev_4', 'dev_5', 'dev_6'
    )
  );

-- Bounds check kept in sync with MAX_SEAT_SLOTS = 8 (0..7). If that constant
-- ever changes, this constraint must be updated in the same migration that
-- changes it.
alter table public.room_members
  drop constraint if exists room_members_seat_slot_check;

alter table public.room_members
  add constraint room_members_seat_slot_check check (
    seat_slot is null or (seat_slot >= 0 and seat_slot < 8)
  );

-- Only one member per room may occupy a given seat slot at a time. Partial
-- index (WHERE seat_slot IS NOT NULL) so members who haven't sat down don't
-- collide with each other under a shared NULL value.
create unique index if not exists room_members_room_seat_unique
  on public.room_members (room_id, seat_slot)
  where seat_slot is not null;

-- ============================================================================
-- claim_seat_slot — atomic seat claim/switch, race-safe
-- ============================================================================
create or replace function public.claim_seat_slot(
  p_room_id uuid,
  p_user_id uuid,
  p_seat_slot integer,
  p_max_slots integer default 8
)
returns table (success boolean, reason text)
language plpgsql
as $$
begin
  if p_seat_slot < 0 or p_seat_slot >= p_max_slots then
    return query select false, 'INVALID_SLOT';
    return;
  end if;

  -- Release this user's current seat first (if any) so "switching seats"
  -- doesn't require the client to call release then claim separately, and
  -- so a user can never occupy two slots at once.
  update public.room_members
    set seat_slot = null
    where room_id = p_room_id and user_id = p_user_id;

  -- Attempt to claim the new slot in one conditional UPDATE — the `not
  -- exists` subquery re-checks occupancy at the moment of the write, inside
  -- the same statement, so Postgres' row locking serializes concurrent
  -- attempts on the same room instead of allowing a read-then-write gap.
  update public.room_members
    set seat_slot = p_seat_slot
    where room_id = p_room_id
      and user_id = p_user_id
      and not exists (
        select 1 from public.room_members m2
        where m2.room_id = p_room_id
          and m2.seat_slot = p_seat_slot
          and m2.user_id <> p_user_id
      );

  if not found then
    return query select false, 'SLOT_TAKEN';
    return;
  end if;

  return query select true, null::text;
end;
$$;

revoke all on function public.claim_seat_slot(uuid, uuid, integer, integer) from public;
grant execute on function public.claim_seat_slot(uuid, uuid, integer, integer) to authenticated;

-- ============================================================================
-- release_seat_slot — explicit stand-up (best-effort client call on leave)
-- ============================================================================
create or replace function public.release_seat_slot(
  p_room_id uuid,
  p_user_id uuid
)
returns void
language plpgsql
as $$
begin
  update public.room_members
    set seat_slot = null,
        avatar_id = null
    where room_id = p_room_id and user_id = p_user_id;
end;
$$;

revoke all on function public.release_seat_slot(uuid, uuid) from public;
grant execute on function public.release_seat_slot(uuid, uuid) to authenticated;
