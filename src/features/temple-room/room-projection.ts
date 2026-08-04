export type RoomEventType = "build" | "deploy" | "migration" | "release";
export type RoomStatus = "waiting" | "praying" | "completed";

export type RoomProjectionRow = {
  id: string;
  slug?: string | null;
  project_name: string;
  event_type: RoomEventType;
  prayer?: string | null;
  title: string;
  description?: string | null;
  status: RoomStatus;
  incense_count?: number | null;
  bell_count?: number | null;
  prayer_count?: number | null;
  offering_count?: number | null;
  energy?: number | null;
  revision?: number | null;
  created_at?: string | null;
  expires_at?: string | null;
  hall_id?: string | null;
  primary_deity_id?: string | null;
  support_deity_ids?: string[] | null;
};

export type RoomSnapshot = {
  id: string;
  title: string;
  projectName: string;
  eventType: RoomEventType;
  prayer: string;
  description: string | null;
  status: RoomStatus;
  incenseCount: number;
  bellCount: number;
  prayerCount: number;
  offeringCount: number;
  energy: number;
  revision: number;
  hallId: string | null;
  primaryDeityId: string | null;
  supportDeityIds: string[];
};

export const ROOM_SUMMARY_COLUMNS = `
  id, slug, project_name, event_type, prayer, description, title, status,
  incense_count, bell_count, prayer_count, offering_count, energy, revision,
  created_at, expires_at, hall_id, primary_deity_id, support_deity_ids
`;

/** Converts database, RPC and view rows into one complete client vocabulary. */
export function toRoomSnapshot(row: RoomProjectionRow): RoomSnapshot {
  return {
    id: row.id,
    title: row.title,
    projectName: row.project_name,
    eventType: row.event_type,
    prayer: row.prayer ?? "",
    description: row.description ?? null,
    status: row.status,
    incenseCount: row.incense_count ?? 0,
    bellCount: row.bell_count ?? 0,
    prayerCount: row.prayer_count ?? 0,
    offeringCount: row.offering_count ?? 0,
    energy: row.energy ?? 0,
    revision: row.revision ?? 0,
    hallId: row.hall_id ?? null,
    primaryDeityId: row.primary_deity_id ?? null,
    supportDeityIds: row.support_deity_ids ?? [],
  };
}
