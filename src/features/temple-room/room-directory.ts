import type { SupabaseClient } from '@supabase/supabase-js';

export interface ActiveProjectRoom {
  id: string;
  slug: string;
  projectName: string;
  eventType: 'build' | 'deploy' | 'migration' | 'release';
  title: string;
  status: 'waiting' | 'praying' | 'completed';
  incenseCount: number;
  bellCount: number;
  prayerCount: number;
  energy: number;
  createdAt: string;
  expiresAt: string;
}

export interface ProjectRankEntry {
  projectName: string;
  roomCount: number;
  totalIncense: number;
  totalBell: number;
  totalPrayer: number;
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
    id: row.id,
    slug: row.slug,
    projectName: row.project_name,
    eventType: row.event_type,
    title: row.title,
    status: row.status,
    incenseCount: row.incense_count,
    bellCount: row.bell_count,
    prayerCount: row.prayer_count,
    energy: row.energy,
    createdAt: row.created_at,
    expiresAt: row.expires_at
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
    avgEnergy: row.avg_energy,
    lastActivityAt: row.last_activity_at
  }));
}
