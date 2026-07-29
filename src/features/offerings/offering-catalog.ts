// Shared developer-offering catalog — deliberately NOT a "use client" module,
// so it can be imported both by the client component (OfferingTray) and by
// server-side route handlers that need to validate an incoming offering id
// against the same whitelist (see src/app/api/rooms/[roomId]/actions/route.ts).
//
// The list of ids here MUST stay in sync with the `check` constraint on
// public.room_offerings.offering_id (supabase/migrations/schema/0011_offering_counter.sql).

export type DeveloperOffering = {
  id: 'laptop' | 'keyboard' | 'coffee' | 'rubber_duck' | 'config_scroll' | 'ci_lantern';
  label: string;
  file: string;
};

export const DEVELOPER_OFFERINGS: DeveloperOffering[] = [
  { id: 'laptop', label: 'Laptop', file: '/developer-offerings-v1/offering-1.png' },
  { id: 'keyboard', label: 'Keyboard', file: '/developer-offerings-v1/offering-2.png' },
  { id: 'coffee', label: 'Cà phê', file: '/developer-offerings-v1/offering-3.png' },
  { id: 'rubber_duck', label: 'Rubber duck', file: '/developer-offerings-v1/offering-4.png' },
  { id: 'config_scroll', label: 'Config scroll', file: '/developer-offerings-v1/offering-5.png' },
  { id: 'ci_lantern', label: 'Đèn CI xanh', file: '/developer-offerings-v1/offering-6.png' }
];

export const OFFERING_IDS = DEVELOPER_OFFERINGS.map((offering) => offering.id);

export function isValidOfferingId(value: unknown): value is DeveloperOffering['id'] {
  return typeof value === 'string' && (OFFERING_IDS as string[]).includes(value);
}
