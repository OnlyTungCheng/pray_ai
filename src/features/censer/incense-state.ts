import type { IncenseStick } from '../../types';

export const INCENSE_BURN_DURATION_MS = 60 * 60 * 1000;
export const INCENSE_IGNITION_MS = 6 * 1000;
export const INCENSE_DYING_THRESHOLD = 0.2;

export type IncensePhase = 'unlit' | 'igniting' | 'burning' | 'dying' | 'expired';

export type IncenseBurnState = {
  phase: IncensePhase;
  progress: number;
  ignitedAt?: number;
  burnDurationMs: number;
};

export function getIncenseBurnState(stick: IncenseStick, now: number): IncenseBurnState {
  const burnDurationMs = stick.burnDurationMs ?? INCENSE_BURN_DURATION_MS;
  const ignitedAt = stick.ignitedAt ?? (stick.exp ? stick.exp - burnDurationMs : undefined);

  if (!ignitedAt) {
    return { phase: 'unlit', progress: 1, burnDurationMs };
  }

  const elapsedMs = Math.max(0, now - ignitedAt);
  const progress = Math.max(0, 1 - elapsedMs / burnDurationMs);

  if (progress <= 0) return { phase: 'expired', progress, ignitedAt, burnDurationMs };
  if (elapsedMs < INCENSE_IGNITION_MS) return { phase: 'igniting', progress, ignitedAt, burnDurationMs };
  if (progress <= INCENSE_DYING_THRESHOLD) return { phase: 'dying', progress, ignitedAt, burnDurationMs };

  return { phase: 'burning', progress, ignitedAt, burnDurationMs };
}
