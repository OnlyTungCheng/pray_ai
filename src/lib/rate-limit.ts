import type { SupabaseClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

export interface RateLimitOptions {
  /** Max requests allowed within the window. Defaults to 15 (within the requested 10-20 range). */
  maxRequests?: number;
  /** Window size in seconds. Defaults to 60 (i.e. ~15 requests/minute). */
  windowSeconds?: number;
}

/**
 * Checks and records a rate-limited request for (userId, endpoint) using the
 * check_rate_limit RPC (see supabase/migrations/0006_generic_api_rate_limit.sql).
 *
 * Returns a 429 NextResponse if the caller has exceeded the limit, or null if
 * the request is allowed to proceed. Usage in a route handler:
 *
 *   const limited = await enforceRateLimit(supabase, user.id, 'rooms:create');
 *   if (limited) return limited;
 */
export async function enforceRateLimit(
  supabase: SupabaseClient,
  userId: string,
  endpoint: string,
  options: RateLimitOptions = {}
): Promise<NextResponse | null> {
  const { maxRequests = 15, windowSeconds = 60 } = options;

  const { data: withinLimit, error } = await supabase.rpc('check_rate_limit', {
    p_user_id: userId,
    p_endpoint: endpoint,
    p_max_requests: maxRequests,
    p_window_seconds: windowSeconds
  });

  // Fail open on infrastructure errors (e.g. migration not yet applied) so a
  // broken rate-limit check doesn't take down the whole API — the endpoint's
  // own logic/validation still runs normally.
  if (error) {
    console.error(`Rate limit check failed for ${endpoint}:`, error.message);
    return null;
  }

  if (!withinLimit) {
    return NextResponse.json(
      {
        error: 'RATE_LIMITED',
        message: `Quá nhiều yêu cầu tới ${endpoint}. Vui lòng thử lại sau ít phút.`
      },
      { status: 429 }
    );
  }

  return null;
}
