import type { SupabaseClient } from '@supabase/supabase-js';
import { toRoomSnapshot, type RoomSnapshot } from './room-projection';

export interface ActiveProjectRoom extends RoomSnapshot {
  slug: string;
  createdAt: string;
  expiresAt: string;
}

export interface ProjectRankEntry {
  projectName: string;
  roomCount: number;
  totalIncense: number;
  totalBell: number;
  totalPrayer: number;
  totalOfferings: number;
  avgEnergy: number;
  lastActivityAt: string;
}

/**
 * Lists currently active (non-expired) project rooms, excluding the
 * permanent system lobby — for the homepage's "Danh sách phòng dự án" (PRD 3.2).
 * Backed by the active_project_rooms view (migration 0005).
 */
export async function listActiveProjectRooms(
  supabase: SupabaseClient,
  limit = 20
): Promise<ActiveProjectRoom[]> {
  const { data, error } = await supabase
    .from('active_project_rooms')
    .select('*')
    .limit(limit);

  if (error || !data) {
    return [];
  }

  return data.map((row) => ({
    ...toRoomSnapshot(row),
    slug: row.slug,
    createdAt: row.created_at,
    expiresAt: row.expires_at,
  }));
}

/**
 * Fetches the Top Rank leaderboard aggregated by project name (PRD 3.2's
 * "Top Rank dự án"). Backed by the project_top_rank view (migration 0005),
 * which already sums counters across every room ever created for a project.
 */
export async function getProjectTopRank(
  supabase: SupabaseClient,
  limit = 10
): Promise<ProjectRankEntry[]> {
  const { data, error } = await supabase
    .from('project_top_rank')
    .select('*')
    .limit(limit);

  if (error || !data) {
    return [];
  }

  return data.map((row) => ({
    projectName: row.project_name,
    roomCount: row.room_count,
    totalIncense: row.total_incense,
    totalBell: row.total_bell,
    totalPrayer: row.total_prayer,
    totalOfferings: row.total_offerings,
    avgEnergy: row.avg_energy,
    lastActivityAt: row.last_activity_at
  }));
}
