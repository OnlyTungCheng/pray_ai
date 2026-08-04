import type { SupabaseClient, User } from '@supabase/supabase-js';

import { createRoom, type CreateRoomInput, type CreatedRoom } from '@/features/temple-room/create-room';
import { getDefaultHall } from '@/features/halls/hall-catalog-service';
import {
  ROOM_SUMMARY_COLUMNS,
  toRoomSnapshot,
  type RoomProjectionRow,
  type RoomSnapshot,
} from '@/features/temple-room/room-projection';

export class RoomServiceError extends Error {
  constructor(
    message: string,
    public readonly code: 'UNAUTHORIZED' | 'ROOM_NOT_FOUND' | 'ROOM_QUERY_FAILED' | 'JOIN_FAILED' | 'CREATE_FAILED'
  ) {
    super(message);
    this.name = 'RoomServiceError';
  }
}

/**
 * Resolves the currently authenticated Supabase user for a server-side request.
 * Anonymous sign-in itself happens client-side (see ensureAnonymousUser) before
 * the request is made; route handlers only need to confirm a session exists.
 * Throws RoomServiceError('UNAUTHORIZED') if there is none.
 */
export async function requireUser(supabase: SupabaseClient): Promise<User> {
  const { data, error } = await supabase.auth.getUser();

  if (error || !data.user) {
    throw new RoomServiceError('No authenticated user for this request', 'UNAUTHORIZED');
  }

  return data.user;
}

export interface RoomSummary extends RoomSnapshot {
  slug: string;
}

/** Fixed slug for the shared system lobby room seeded by migration 0004. */
export const SYSTEM_LOBBY_SLUG = 'sanh-chung';

export function toRoomSummary(row: RoomProjectionRow & { slug: string }): RoomSummary {
  return {
    ...toRoomSnapshot(row),
    slug: row.slug,
  };
}

/**
 * Fetches the shared system lobby room used by the homepage (PRD 3.2's
 * "sảnh chung"). Does not create it — see migration 0004_seed_system_lobby_room.sql,
 * which seeds it idempotently. Returns null if the migration hasn't been run yet.
 */
export async function getSystemLobbyRoom(supabase: SupabaseClient): Promise<RoomSummary | null> {
  const { data, error } = await supabase
    .from('rooms')
    .select(ROOM_SUMMARY_COLUMNS)
    .eq('slug', SYSTEM_LOBBY_SLUG)
    .maybeSingle();

  if (error || !data) {
    return null;
  }

  return toRoomSummary(data as RoomProjectionRow & { slug: string });
}

/**
 * Fetches a single room by id, using the same ROOM_SUMMARY_COLUMNS/mapRoomRow
 * as every other room read in this file. Exists so that
 * src/app/temple/[roomId]/page.tsx (both its generateMetadata and the page
 * component itself, which both need this same room) has one shared,
 * type-correct source instead of each hand-rolling its own `select(...)` +
 * snake_case-to-camelCase mapping — the previous hand-rolled version in
 * page.tsx had drifted out of sync with RoomSummary (missing offeringCount,
 * hallId, primaryDeityId, supportDeityIds entirely).
 */
export async function getRoomById(supabase: SupabaseClient, roomId: string): Promise<RoomSummary | null> {
  const { data, error } = await supabase
    .from('rooms')
    .select(ROOM_SUMMARY_COLUMNS)
    .eq('id', roomId)
    .maybeSingle();

  if (error || !data) {
    return null;
  }

  return toRoomSummary(data as RoomProjectionRow & { slug: string });
}

/**
 * Creates a new temple room on behalf of an authenticated user.
 * Matches the doc's /pray flow: nhập project/event/prayer -> tạo phòng.
 *
 * Per docs/than.md §4 (revised flow): picking a Hall (Điện) is NOT required
 * to create a room. If `hallId` is omitted entirely (`undefined` — distinct
 * from an explicit `null`, which callers can still pass to deliberately
 * create a hall-less room, e.g. matching the pre-feature system lobby),
 * this auto-assigns the default Hall (lowest sort_order) and its primary
 * deity, so every room always renders with *some* Hall context. Users can
 * switch Halls afterwards via PATCH /api/rooms/[roomId]/hall.
 */
export async function createRoomForUser(
  supabase: SupabaseClient,
  input: CreateRoomInput
): Promise<{ user: User; room: CreatedRoom }> {
  const user = await requireUser(supabase);

  try {
    let resolvedInput = input;

    if (input.hallId === undefined) {
      const defaultHall = await getDefaultHall(supabase);
      if (defaultHall) {
        resolvedInput = {
          ...input,
          hallId: defaultHall.id,
          primaryDeityId: input.primaryDeityId ?? defaultHall.deities[0]?.slug ?? null
        };
      }
      // If no halls exist at all (e.g. seed hasn't run), fall through and
      // create a hall-less room rather than failing room creation entirely
      // — the Hall system is additive, not a hard dependency for /pray to work.
    }

    const room = await createRoom(supabase, resolvedInput);
    const { error: ownerError } = await supabase.from('room_members').upsert(
      { room_id: room.id, user_id: user.id, display_name: user.email?.split('@')[0] ?? 'Room owner', role: 'owner' },
      { onConflict: 'room_id,user_id' },
    );
    if (ownerError) throw ownerError;
    return { user, room };
  } catch (cause) {
    throw new RoomServiceError(
      cause instanceof Error ? cause.message : 'Failed to create room',
      'CREATE_FAILED'
    );
  }
}

/**
 * Adds (or re-adds) an authenticated user as a member of an existing room,
 * consolidating the lookup + upsert logic that previously lived inline in
 * src/app/api/rooms/[roomId]/join/route.ts.
 */
export async function joinRoomForUser(
  supabase: SupabaseClient,
  roomId: string,
  displayName: string
): Promise<{ user: User; room: RoomSummary }> {
  const user = await requireUser(supabase);

  const { data: room, error: roomError } = await supabase
    .from('rooms')
    .select(ROOM_SUMMARY_COLUMNS)
    .eq('id', roomId)
    .maybeSingle();

  if (roomError) {
    throw new RoomServiceError(roomError.message, 'ROOM_QUERY_FAILED');
  }

  if (!room) {
    throw new RoomServiceError(`Room ${roomId} was not found`, 'ROOM_NOT_FOUND');
  }

  const { error: joinError } = await supabase.from('room_members').upsert(
    {
      room_id: roomId,
      user_id: user.id,
      display_name: displayName
    },
    {
      onConflict: 'room_id,user_id'
    }
  );

  if (joinError) {
    throw new RoomServiceError(joinError.message, 'JOIN_FAILED');
  }

  return {
    user,
    room: toRoomSummary(room as RoomProjectionRow & { slug: string })
  };
}

export interface SeatedMember {
  userId: string;
  displayName: string;
  seatSlot: number | null;
  avatarId: string | null;
}

/**
 * Lists room members who currently have a seat_slot/avatar_id recorded in
 * the database — used to render an initial "who's sitting where" snapshot
 * before the Realtime Presence channel has connected and synced (see
 * docs/prd-chibi-avatar-seats.md §3.5). Presence remains the authoritative
 * live view once connected; this is only a best-known-state fallback to
 * avoid a flash of empty seats on first render.
 */
export async function listSeatedMembers(
  supabase: SupabaseClient,
  roomId: string
): Promise<SeatedMember[]> {
  const { data, error } = await supabase
    .from('room_members')
    .select('user_id, display_name, seat_slot, avatar_id')
    .eq('room_id', roomId)
    .not('seat_slot', 'is', null);

  if (error || !data) {
    return [];
  }

  return data.map((row) => ({
    userId: row.user_id,
    displayName: row.display_name,
    seatSlot: row.seat_slot,
    avatarId: row.avatar_id
  }));
}
