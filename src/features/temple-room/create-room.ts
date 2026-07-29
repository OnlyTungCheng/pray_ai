import type { SupabaseClient } from '@supabase/supabase-js';

/** Matches the doc's eventType union used across rooms.event_type. */
export type PrayerEventType = 'build' | 'deploy' | 'migration' | 'release';

export interface CreateRoomInput {
  /** e.g. "Notex" — doc's "Tên dự án". */
  projectName: string;
  eventType: PrayerEventType;
  /** e.g. "Mong build xanh và không lỗi authentication" — doc's "Lời cầu". */
  prayer: string;
  /** Optional human-readable title override; defaults to a generated one. */
  title?: string;
  description?: string;
}

export interface CreatedRoom {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  status: 'waiting' | 'praying' | 'completed';
  incenseCount: number;
  bellCount: number;
  prayerCount: number;
  energy: number;
  revision: number;
}

const SLUG_MAX_LENGTH = 48;

/**
 * Converts a project name into a URL-safe slug fragment.
 * "Notex" -> "notex", "Đền Cầu Nguyện" -> "den-cau-nguyen".
 */
export function slugifyProjectName(projectName: string): string {
  const normalized = projectName
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // strip diacritics
    .replace(/đ/gi, 'd')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

  return normalized.slice(0, SLUG_MAX_LENGTH) || 'room';
}

/**
 * Builds the doc's `/temple/notex-v2-4`-style slug: project name + a short
 * random suffix, so concurrent rooms for the same project don't collide.
 */
export function buildRoomSlug(
  projectName: string,
  randomSuffix: () => string = () => Math.random().toString(36).slice(2, 6)
): string {
  const base = slugifyProjectName(projectName);
  return `${base}-${randomSuffix()}`;
}

function defaultTitle(input: CreateRoomInput): string {
  const eventLabel: Record<PrayerEventType, string> = {
    build: 'Build',
    deploy: 'Deploy production',
    migration: 'Migration database',
    release: 'Release'
  };

  return `${input.projectName} · ${eventLabel[input.eventType]}`;
}

/**
 * Inserts a new temple room row. Caller is responsible for authentication
 * (see ensureAnonymousUser) — this function only handles the room-creation
 * logic itself, matching the shape join/actions route handlers already expect.
 */
export async function createRoom(
  supabase: SupabaseClient,
  input: CreateRoomInput
): Promise<CreatedRoom> {
  const slug = buildRoomSlug(input.projectName);

  const { data, error } = await supabase
    .from('rooms')
    .insert({
      slug,
      project_name: input.projectName,
      event_type: input.eventType,
      prayer: input.prayer,
      title: input.title ?? defaultTitle(input),
      description: input.description ?? null
    })
    .select(
      `
        id,
        slug,
        title,
        description,
        status,
        incense_count,
        bell_count,
        prayer_count,
        energy,
        revision
      `
    )
    .single();

  if (error || !data) {
    throw new Error(error?.message ?? 'Failed to create room');
  }

  return {
    id: data.id,
    slug: data.slug,
    title: data.title,
    description: data.description,
    status: data.status,
    incenseCount: data.incense_count,
    bellCount: data.bell_count,
    prayerCount: data.prayer_count,
    energy: data.energy,
    revision: data.revision
  };
}
