import type { OracleResult, OracleTier, PrayerEventType } from './types';
import { ORACLE_DISCLAIMER } from './types';
import { pickMessage } from './messages';

/**
 * Base weights for each tier, roughly modeled after a traditional 籤 (chim/xăm)
 * draw: good outcomes are more common than very bad ones, so the ritual stays
 * fun rather than punishing.
 */
const BASE_TIER_WEIGHTS: Record<OracleTier, number> = {
  dai_cat: 20,
  cat: 30,
  binh: 25,
  hung: 18,
  dai_hung: 7
};

/**
 * "Friday deploy curse" — the doc's example result explicitly calls out
 * 16:57 on a Friday as a bad omen. We generalize this into a bias window
 * (Friday 16:00 onward) that shifts weight away from good tiers and toward
 * Hung/Đại Hung, without making a good result impossible.
 */
const FRIDAY_CURSE_WEEKDAY = 5; // JS Date#getDay(): 0=Sun ... 5=Fri
const FRIDAY_CURSE_START_HOUR = 16;

function isFridayDeployCurseWindow(date: Date): boolean {
  return date.getDay() === FRIDAY_CURSE_WEEKDAY && date.getHours() >= FRIDAY_CURSE_START_HOUR;
}

function applyFridayCurseBias(
  weights: Record<OracleTier, number>
): Record<OracleTier, number> {
  return {
    dai_cat: weights.dai_cat * 0.3,
    cat: weights.cat * 0.5,
    binh: weights.binh * 0.8,
    hung: weights.hung * 2.5,
    dai_hung: weights.dai_hung * 4
  };
}

function weightedRandomTier(
  weights: Record<OracleTier, number>,
  random: () => number
): OracleTier {
  const entries = Object.entries(weights) as [OracleTier, number][];
  const total = entries.reduce((sum, [, weight]) => sum + weight, 0);
  let roll = random() * total;

  for (const [tier, weight] of entries) {
    if (roll < weight) {
      return tier;
    }
    roll -= weight;
  }

  // Floating point fallback — should not normally be reached.
  return entries[entries.length - 1][0];
}

export interface DrawOracleOptions {
  eventType: PrayerEventType;
  /** Injectable for deterministic testing; defaults to Math.random. */
  random?: () => number;
  /** Injectable "now" for deterministic testing of the Friday-curse window. */
  now?: Date;
  /** Injectable id generator; defaults to crypto.randomUUID. */
  generateId?: () => string;
}

/**
 * Draws a single oracle result for a completed prayer ritual.
 * Pure aside from the injected random/time/id sources, so it's fully testable
 * and has no dependency on Supabase or any storage layer.
 */
export function drawOracle(options: DrawOracleOptions): OracleResult {
  const random = options.random ?? Math.random;
  const now = options.now ?? new Date();
  const generateId = options.generateId ?? (() => crypto.randomUUID());

  const weights = isFridayDeployCurseWindow(now)
    ? applyFridayCurseBias(BASE_TIER_WEIGHTS)
    : BASE_TIER_WEIGHTS;

  const tier = weightedRandomTier(weights, random);
  const message = pickMessage(tier, options.eventType, random);

  return {
    id: generateId(),
    tier,
    eventType: options.eventType,
    message,
    disclaimer: ORACLE_DISCLAIMER,
    createdAt: now.toISOString()
  };
}
