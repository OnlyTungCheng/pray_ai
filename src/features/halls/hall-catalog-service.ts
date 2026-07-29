import type { SupabaseClient } from '@supabase/supabase-js';

import { DEITIES, getDeitiesForHall, isValidDeitySlug, type Deity } from '@/features/halls/deity-catalog';
import { getRitualsForHall, getOfferingsForHall, type HallRitual, type HallOffering } from '@/features/halls/hall-content-catalog';

// Hall (Điện) stays DB-backed (see supabase/migrations/schema/0014_halls_and_deities.sql)
// — the list of Halls may grow without a code deploy. Deity (Thần) and
// per-hall content (rituals/offerings) are hardcoded catalogs instead (see
// deity-catalog.ts / hall-content-catalog.ts) per explicit product
// decision. This module joins the two: it reads Hall rows from the DB and
// attaches their deities/rituals/offerings from the hardcoded catalogs by
// matching on `hall.slug`.

export type { Deity } from '@/features/halls/deity-catalog';
export type { HallRitual, HallOffering } from '@/features/halls/hall-content-catalog';

export interface Hall {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  sortOrder: number;
  deities: Deity[];
  rituals: HallRitual[];
  offerings: HallOffering[];
}

const HALL_COLUMNS = `
  id,
  slug,
  name,
  description,
  sort_order
`;

function mapHallRow(row: {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  sort_order: number;
}): Hall {
  return {
    id: row.id,
    slug: row.slug,
    name: row.name,
    description: row.description,
    sortOrder: row.sort_order,
    deities: getDeitiesForHall(row.slug),
    rituals: getRitualsForHall(row.slug),
    offerings: getOfferingsForHall(row.slug)
  };
}

/**
 * Lists every Hall (Điện) with its deity roster + ritual/offering content
 * attached from the hardcoded catalogs, ordered for display. Backed by a
 * public-read RLS policy — safe to call with the anon client.
 */
export async function listHalls(supabase: SupabaseClient): Promise<Hall[]> {
  const { data, error } = await supabase
    .from('halls')
    .select(HALL_COLUMNS)
    .order('sort_order', { ascending: true });

  if (error || !data) {
    return [];
  }

  return data.map(mapHallRow);
}

/** Fetches a single Hall by slug, with its deities/content attached. Returns null if not found. */
export async function getHallBySlug(supabase: SupabaseClient, slug: string): Promise<Hall | null> {
  const { data, error } = await supabase
    .from('halls')
    .select(HALL_COLUMNS)
    .eq('slug', slug)
    .maybeSingle();

  if (error || !data) {
    return null;
  }

  return mapHallRow(data);
}

/**
 * Fetches the "default" Hall — the one with the lowest sort_order.
 *
 * Per docs/than.md §4 (revised flow): creating a project prayer room never
 * requires picking a Hall up front. If the caller omits hallId entirely,
 * the room is auto-assigned this default Hall (and its primary deity, from
 * the hardcoded catalog) so every room always has *some* Hall context to
 * render in its header — users can switch to a different Hall afterwards
 * (see the room's PATCH /api/rooms/[roomId]/hall route). Returns null only
 * if no halls exist at all (e.g. migrations/seed haven't run yet).
 */
export async function getDefaultHall(supabase: SupabaseClient): Promise<Hall | null> {
  const { data, error } = await supabase
    .from('halls')
    .select(HALL_COLUMNS)
    .order('sort_order', { ascending: true })
    .limit(1)
    .maybeSingle();

  if (error || !data) {
    return null;
  }

  return mapHallRow(data);
}

export interface DeitySelection {
  hallId: string | null;
  /** A deity *slug* from deity-catalog.ts, not a DB id. */
  primaryDeityId: string | null;
  supportDeityIds: string[];
}

export type DeitySelectionValidationError =
  | 'TOO_MANY_SUPPORT_DEITIES'
  | 'HALL_NOT_FOUND'
  | 'PRIMARY_DEITY_NOT_IN_HALL'
  | 'SUPPORT_DEITY_NOT_IN_HALL'
  | 'PRIMARY_DEITY_DUPLICATED_IN_SUPPORT'
  | 'DEITIES_WITHOUT_HALL'
  | 'UNKNOWN_DEITY_SLUG';

/**
 * Server-side validation for a room's hall/deity selection. The Hall side
 * is validated against the database (halls table); the deity side is
 * validated against the hardcoded deity-catalog.ts whitelist — mirroring
 * the same split used by mapHallRow() above. Always call this before
 * inserting/updating a room's hall_id/primary_deity_id/support_deity_ids —
 * the DB trigger (check_room_deities_belong_to_hall, schema/0016) is a
 * second, defense-in-depth layer, not a substitute for a clean 4xx error at
 * the API boundary.
 */
export async function validateDeitySelection(
  supabase: SupabaseClient,
  selection: DeitySelection
): Promise<{ valid: true } | { valid: false; error: DeitySelectionValidationError }> {
  const { hallId, primaryDeityId, supportDeityIds } = selection;

  if (supportDeityIds.length > 2) {
    return { valid: false, error: 'TOO_MANY_SUPPORT_DEITIES' };
  }

  if (hallId === null) {
    if (primaryDeityId !== null || supportDeityIds.length > 0) {
      return { valid: false, error: 'DEITIES_WITHOUT_HALL' };
    }
    return { valid: true };
  }

  const { data: hallRow, error: hallError } = await supabase
    .from('halls')
    .select('id, slug')
    .eq('id', hallId)
    .maybeSingle();

  if (hallError || !hallRow) {
    return { valid: false, error: 'HALL_NOT_FOUND' };
  }

  if (primaryDeityId !== null && supportDeityIds.includes(primaryDeityId)) {
    return { valid: false, error: 'PRIMARY_DEITY_DUPLICATED_IN_SUPPORT' };
  }

  const slugsToCheck = [primaryDeityId, ...supportDeityIds].filter((s): s is string => s !== null);

  for (const slug of slugsToCheck) {
    if (!isValidDeitySlug(slug)) {
      return { valid: false, error: 'UNKNOWN_DEITY_SLUG' };
    }
  }

  const deityHallSlugBySlug = new Map(DEITIES.map((d) => [d.slug, d.hallSlug]));

  if (primaryDeityId !== null && deityHallSlugBySlug.get(primaryDeityId) !== hallRow.slug) {
    return { valid: false, error: 'PRIMARY_DEITY_NOT_IN_HALL' };
  }

  if (supportDeityIds.some((slug) => deityHallSlugBySlug.get(slug) !== hallRow.slug)) {
    return { valid: false, error: 'SUPPORT_DEITY_NOT_IN_HALL' };
  }

  return { valid: true };
}
