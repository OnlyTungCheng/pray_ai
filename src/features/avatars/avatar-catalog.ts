// Preset chibi avatar catalog — deliberately NOT a "use client" module, so it
// can be imported both by client UI (avatar picker, to be built later) and by
// server-side route handlers that need to validate an incoming avatar id
// against the same whitelist (see src/app/api/rooms/[roomId]/seat/route.ts).
//
// The list of ids here MUST stay in sync with the `check` constraint on
// public.room_members.avatar_id (supabase/migrations/schema/0013_seat_slots.sql).
//
// File paths are placeholders — actual chibi character art has not been
// generated/chosen yet (UI/design phase comes later, per the PRD). Only the
// ids and count matter for the backend logic implemented now.

export type ChibiAvatar = {
  id: 'dev_1' | 'dev_2' | 'dev_3' | 'dev_4' | 'dev_5' | 'dev_6';
  label: string;
  file: string;
};

export const CHIBI_AVATARS: ChibiAvatar[] = [
  { id: 'dev_1', label: 'Dev 1', file: '/chibi-avatars-v1/avatar-1.png' },
  { id: 'dev_2', label: 'Dev 2', file: '/chibi-avatars-v1/avatar-2.png' },
  { id: 'dev_3', label: 'Dev 3', file: '/chibi-avatars-v1/avatar-3.png' },
  { id: 'dev_4', label: 'Dev 4', file: '/chibi-avatars-v1/avatar-4.png' },
  { id: 'dev_5', label: 'Dev 5', file: '/chibi-avatars-v1/avatar-5.png' },
  { id: 'dev_6', label: 'Dev 6', file: '/chibi-avatars-v1/avatar-6.png' }
];

export const AVATAR_IDS = CHIBI_AVATARS.map((avatar) => avatar.id);

export function isValidAvatarId(value: unknown): value is ChibiAvatar['id'] {
  return typeof value === 'string' && (AVATAR_IDS as string[]).includes(value);
}
