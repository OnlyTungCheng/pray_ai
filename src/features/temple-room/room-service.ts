import type { SupabaseClient, User } from '@supabase/supabase-js';

import { createRoom, type CreateRoomInput, type CreatedRoom } from '@/features/temple-room/create-room';

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

export interface RoomSummary {
  id: string;
  slug: string;
  title: string;
  projectName: string;
  eventType: 'build' | 'deploy' | 'migration' | 'release';
  prayer: string;
  description: string | null;
  status: 'waiting' | 'praying' | 'completed';
  incenseCount: number;
  bellCount: number;
  prayerCount: number;
  energy: number;
  revision: number;
}

/** Fixed slug for the shared system lobby room seeded by migration 0004. */
export const SYSTEM_LOBBY_SLUG = 'sanh-chung';

const ROOM_SUMMARY_COLUMNS = `
  id,
  slug,
  title,
  project_name,
  event_type,
  prayer,
  description,
  status,
  incense_count,
  bell_count,
  prayer_count,
  energy,
  revision
`;

function mapRoomRow(row: {
  id: string;
  slug: string;
  title: string;
  project_name: string;
  event_type: 'build' | 'deploy' | 'migration' | 'release';
  prayer: string;
  description: string | null;
  status: 'waiting' | 'praying' | 'completed';
  incense_count: number;
  bell_count: number;
  prayer_count: number;
  energy: number;
  revision: number;
}): RoomSummary {
  return {
    id: row.id,
    slug: row.slug,
    title: row.title,
    projectName: row.project_name,
    eventType: row.event_type,
    prayer: row.prayer,
    description: row.description,
    status: row.status,
    incenseCount: row.incense_count,
    bellCount: row.bell_count,
    prayerCount: row.prayer_count,
    energy: row.energy,
    revision: row.revision
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

  return mapRoomRow(data);
}

/**
 * Creates a new temple room on behalf of an authenticated user.
 * Matches the doc's /pray flow: nhập project/event/prayer -> tạo phòng.
 */
export async function createRoomForUser(
  supabase: SupabaseClient,
  input: CreateRoomInput
): Promise<{ user: User; room: CreatedRoom }> {
  const user = await requireUser(supabase);

  try {
    const room = await createRoom(supabase, input);
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
    room: mapRoomRow(room)
  };
}
