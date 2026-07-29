// Hardcoded Thần (Deity) catalog — per explicit product decision: "thần
// không cần BE đâu, hardcode là được". Mirrors the exact pattern of
// offering-catalog.ts / avatar-catalog.ts: a small fixed list + an
// isValid*() whitelist guard, importable from both server route handlers
// and (later) client UI. NOT a "use client" file.
//
// Unlike Hall (Điện, still DB-backed — see hall-catalog-service.ts), Deity
// content changes rarely enough and is tied closely enough to code (tool
// icons, branding) that hardcoding is the simpler choice here. `hallSlug`
// links a deity to its Hall by slug (not by DB id), since Hall is the only
// side of this relationship still backed by a database row.
//
// IMPORTANT: the whitelist check in
// supabase/migrations/schema/0016_deities_hardcode_migration.sql's
// check_room_deities_belong_to_hall trigger duplicates this list's slugs
// and hall mapping as a hardcoded SQL array/jsonb (there is no shared
// source of truth between TypeScript and SQL for this, same tradeoff
// already accepted elsewhere in this codebase). If you add/remove/move a
// deity here, update that trigger too, in a new migration.

export interface Deity {
  id: string;
  /** Stable identifier stored in rooms.primary_deity_id / support_deity_ids. */
  slug: string;
  /** Which Hall (by slug) this deity belongs to. */
  hallSlug: string;
  /** Display name, e.g. "Thần Vercel". */
  name: string;
  /** The actual tool this deity represents, e.g. "Vercel". */
  toolName: string;
  description: string;
  /** Placeholder for a future icon/illustration lookup — no real art yet. */
  imageKey: string | null;
  sortOrder: number;
}

export const DEITIES: Deity[] = [
  // Điện Vạn Sự Khai Triển (khai-trien)
  {
    id: 'deity_vercel',
    slug: 'vercel',
    hallSlug: 'khai-trien',
    name: 'Thần Vercel',
    toolName: 'Vercel',
    description: 'Chủ thần khai triển — bảo trợ build và deploy production.',
    imageKey: null,
    sortOrder: 1
  },
  {
    id: 'deity_netlify',
    slug: 'netlify',
    hallSlug: 'khai-trien',
    name: 'Thần Netlify',
    toolName: 'Netlify',
    description: 'Hộ thần khai triển — bảo trợ preview deployment.',
    imageKey: null,
    sortOrder: 2
  },
  {
    id: 'deity_cloudflare',
    slug: 'cloudflare',
    hallSlug: 'khai-trien',
    name: 'Thần Cloudflare',
    toolName: 'Cloudflare',
    description: 'Hộ thần hạ tầng — bảo trợ CDN và domain cutover.',
    imageKey: null,
    sortOrder: 3
  },

  // Điện Hợp Nhất Vạn Nhánh (hop-nhat)
  {
    id: 'deity_github',
    slug: 'github',
    hallSlug: 'hop-nhat',
    name: 'Thần GitHub',
    toolName: 'GitHub',
    description: 'Chủ thần hợp nhất — bảo trợ pull request và CI checks.',
    imageKey: null,
    sortOrder: 1
  },
  {
    id: 'deity_gitlab',
    slug: 'gitlab',
    hallSlug: 'hop-nhat',
    name: 'Thần GitLab',
    toolName: 'GitLab',
    description: 'Hộ thần hợp nhất — bảo trợ pipeline và review.',
    imageKey: null,
    sortOrder: 2
  },
  {
    id: 'deity_bitbucket',
    slug: 'bitbucket',
    hallSlug: 'hop-nhat',
    name: 'Thần Bitbucket',
    toolName: 'Bitbucket',
    description: 'Hộ thần hợp nhất — bảo trợ merge và giải conflict.',
    imageKey: null,
    sortOrder: 3
  },

  // Điện Dữ Hải Trường Tồn (du-hai)
  {
    id: 'deity_supabase',
    slug: 'supabase',
    hallSlug: 'du-hai',
    name: 'Thần Supabase',
    toolName: 'Supabase',
    description: 'Chủ thần dữ hải — bảo trợ migration, RLS và realtime.',
    imageKey: null,
    sortOrder: 1
  },
  {
    id: 'deity_firebase',
    slug: 'firebase',
    hallSlug: 'du-hai',
    name: 'Thần Firebase',
    toolName: 'Firebase',
    description: 'Hộ thần dữ hải — bảo trợ auth và storage.',
    imageKey: null,
    sortOrder: 2
  },
  {
    id: 'deity_postgresql',
    slug: 'postgresql',
    hallSlug: 'du-hai',
    name: 'Thần PostgreSQL',
    toolName: 'PostgreSQL',
    description: 'Hộ thần dữ hải — bảo trợ schema và backup dữ liệu.',
    imageKey: null,
    sortOrder: 3
  },

  // Điện Trí Tuệ Vạn Lời (tri-tue)
  {
    id: 'deity_openai',
    slug: 'openai',
    hallSlug: 'tri-tue',
    name: 'Thần OpenAI',
    toolName: 'OpenAI',
    description: 'Chủ thần trí tuệ — bảo trợ prompt, reasoning và tool calling.',
    imageKey: null,
    sortOrder: 1
  },
  {
    id: 'deity_claude',
    slug: 'claude',
    hallSlug: 'tri-tue',
    name: 'Thần Claude',
    toolName: 'Claude',
    description: 'Hộ thần trí tuệ — bảo trợ context và structured output.',
    imageKey: null,
    sortOrder: 2
  },
  {
    id: 'deity_gemini',
    slug: 'gemini',
    hallSlug: 'tri-tue',
    name: 'Thần Gemini',
    toolName: 'Gemini',
    description: 'Hộ thần trí tuệ — bảo trợ tác vụ đa phương tiện.',
    imageKey: null,
    sortOrder: 3
  },

  // Điện Thiên Vân Vạn Tượng (thien-van)
  {
    id: 'deity_aws',
    slug: 'aws',
    hallSlug: 'thien-van',
    name: 'Thần AWS',
    toolName: 'AWS',
    description: 'Chủ thần thiên vân — bảo trợ compute, storage và autoscaling.',
    imageKey: null,
    sortOrder: 1
  },
  {
    id: 'deity_gcp',
    slug: 'gcp',
    hallSlug: 'thien-van',
    name: 'Thần Google Cloud',
    toolName: 'Google Cloud',
    description: 'Hộ thần thiên vân — bảo trợ networking và dịch vụ dữ liệu.',
    imageKey: null,
    sortOrder: 2
  },
  {
    id: 'deity_azure',
    slug: 'azure',
    hallSlug: 'thien-van',
    name: 'Thần Azure',
    toolName: 'Azure',
    description: 'Hộ thần thiên vân — bảo trợ cloud doanh nghiệp và IAM.',
    imageKey: null,
    sortOrder: 3
  },

  // Điện Minh Giám Vạn Log (minh-giam)
  {
    id: 'deity_sentry',
    slug: 'sentry',
    hallSlug: 'minh-giam',
    name: 'Thần Sentry',
    toolName: 'Sentry',
    description: 'Chủ thần minh giám — bảo trợ error tracking và stack trace.',
    imageKey: null,
    sortOrder: 1
  },
  {
    id: 'deity_datadog',
    slug: 'datadog',
    hallSlug: 'minh-giam',
    name: 'Thần Datadog',
    toolName: 'Datadog',
    description: 'Hộ thần minh giám — bảo trợ monitoring và alert.',
    imageKey: null,
    sortOrder: 2
  },
  {
    id: 'deity_grafana',
    slug: 'grafana',
    hallSlug: 'minh-giam',
    name: 'Thần Grafana',
    toolName: 'Grafana',
    description: 'Hộ thần minh giám — bảo trợ dashboard và observability.',
    imageKey: null,
    sortOrder: 3
  }
];

const DEITY_SLUGS = new Set(DEITIES.map((d) => d.slug));

export function isValidDeitySlug(value: unknown): value is string {
  return typeof value === 'string' && DEITY_SLUGS.has(value);
}

export function getDeityBySlug(slug: string): Deity | undefined {
  return DEITIES.find((d) => d.slug === slug);
}

/** Lists every deity belonging to a Hall (by slug), sorted for display. */
export function getDeitiesForHall(hallSlug: string): Deity[] {
  return DEITIES.filter((d) => d.hallSlug === hallSlug).sort((a, b) => a.sortOrder - b.sortOrder);
}
