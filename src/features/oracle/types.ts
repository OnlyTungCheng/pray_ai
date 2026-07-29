/**
 * Types for the "Quẻ Deploy" oracle system.
 *
 * The oracle draws a random fortune tier after a prayer ritual is completed,
 * paired with a tier-appropriate, event-aware message. Purely for entertainment —
 * see OracleResult.disclaimer.
 */

/** The five fortune tiers, ordered from best to worst. */
export type OracleTier = 'dai_cat' | 'cat' | 'binh' | 'hung' | 'dai_hung';

/** Vietnamese display label for each tier. */
export const ORACLE_TIER_LABELS: Record<OracleTier, string> = {
  dai_cat: 'Đại Cát',
  cat: 'Cát',
  binh: 'Bình',
  hung: 'Hung',
  dai_hung: 'Đại Hung'
};

/**
 * The kind of ritual/event the user is praying for.
 * Mirrors TempleRoom.eventType from the product doc, plus a few of the
 * specific prayer intents called out in the "Vòng lặp trải nghiệm chính" section.
 */
export type PrayerEventType =
  | 'build'
  | 'deploy'
  | 'migration'
  | 'release'
  | 'friday_night_bug'
  | 'requirement_change'
  | 'pr_review'
  | 'server_crash'
  | 'rollback';

export interface OracleResult {
  /** Stable id for this drawn result, used for the /oracle/[resultId] route. */
  id: string;
  tier: OracleTier;
  eventType: PrayerEventType;
  /** The humorous fortune message shown to the user. */
  message: string;
  /** Standing disclaimer shown alongside every result. */
  disclaimer: string;
  /** When the oracle was drawn (ISO 8601). */
  createdAt: string;
}

export const ORACLE_DISCLAIMER =
  'Kết quả chỉ mang tính giải trí. CI/CD vẫn nên dựa vào test, monitoring và rollback plan.';
