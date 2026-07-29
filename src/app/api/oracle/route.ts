import { NextResponse } from 'next/server';
import { z } from 'zod';

import { createClient } from '@/lib/supabase/server';
import { enforceRateLimit } from '@/lib/rate-limit';
import { drawOracle } from '@/features/oracle/draw-oracle';
import type { PrayerEventType } from '@/features/oracle/types';

const drawOracleSchema = z.object({
  eventType: z.enum([
    'build',
    'deploy',
    'migration',
    'release',
    'friday_night_bug',
    'requirement_change',
    'pr_review',
    'server_crash',
    'rollback'
  ]),
  roomId: z.string().uuid().optional()
});

/**
 * Draws and persists a "quẻ deploy" oracle result server-side.
 *
 * This intentionally does NOT accept a tier or message from the client —
 * the whole point of the oracle is that its outcome is decided by the server
 * (random + the Friday-deploy-curse time bias), not something a client can
 * forge by editing a query string before hitting /oracle/[resultId].
 */
export async function POST(request: Request) {
  const parsedBody = drawOracleSchema.safeParse(await request.json());

  if (!parsedBody.success) {
    return NextResponse.json(
      {
        error: 'INVALID_REQUEST',
        details: parsedBody.error.flatten()
      },
      { status: 400 }
    );
  }

  const supabase = await createClient();

  const {
    data: { user },
    error: userError
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 });
  }

  const rateLimited = await enforceRateLimit(supabase, user.id, 'oracle:draw');
  if (rateLimited) return rateLimited;

  const result = drawOracle({
    eventType: parsedBody.data.eventType as PrayerEventType
  });

  const { error: insertError } = await supabase.from('oracle_results').insert({
    id: result.id,
    room_id: parsedBody.data.roomId ?? null,
    user_id: user.id,
    tier: result.tier,
    event_type: result.eventType,
    message: result.message
  });

  if (insertError) {
    return NextResponse.json({ error: 'ORACLE_PERSIST_FAILED' }, { status: 500 });
  }

  return NextResponse.json({ result }, { status: 201 });
}
