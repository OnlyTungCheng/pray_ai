// Fixed number of seat slots per room, shared across every room type
// (system lobby and per-project rooms alike) — per the PRD's "hiện tại cố
// định" decision (docs/prd-chibi-avatar-seats.md §5). If per-room slot
// counts are ever needed, add a `rooms.max_seat_slots` column defaulting to
// this constant rather than changing this file's meaning.
export const MAX_SEAT_SLOTS = 8;

/** Valid seat slot indices: 0..(MAX_SEAT_SLOTS - 1). */
export function isValidSeatSlot(value: unknown): value is number {
  return typeof value === 'number' && Number.isInteger(value) && value >= 0 && value < MAX_SEAT_SLOTS;
}
