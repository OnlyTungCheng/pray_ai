import { NextResponse } from 'next/server';
import { z } from 'zod';

import { createClient } from '@/lib/supabase/server';
import { enforceRateLimit } from '@/lib/rate-limit';
import { createRoomForUser, requireUser, RoomServiceError } from '@/features/temple-room/room-service';
import { validateDeitySelection } from '@/features/halls/hall-catalog-service';

const createRoomSchema = z.object({
  projectName: z.string().trim().min(1).max(80),
  eventType: z.enum(['build', 'deploy', 'migration', 'release']),
  prayer: z.string().trim().min(1).max(280),
  title: z.string().trim().min(1).max(120).optional(),
  description: z.string().trim().max(280).optional(),
  // Per docs/than.md §4 (revised flow): picking a Hall is NOT required to
  // create a room. Omitting hallId entirely auto-assigns a default Hall
  // server-side (see createRoomForUser) — passing it explicitly as `null`
  // is a distinct, deliberate "no hall" request (kept for API flexibility,
  // e.g. scripts recreating a system-lobby-like room), not the same thing
  // as omitting it. Do not collapse `undefined` into `null` anywhere below.
  // hallId is a real DB id (halls table stays DB-backed). primaryDeityId/
  // supportDeityIds are deity *slugs* from the hardcoded deity-catalog.ts
  // (e.g. "vercel") — Deity is not a DB table, so these are plain strings,
  // not uuids.
  hallId: z.string().uuid().nullable().optional(),
  primaryDeityId: z.string().trim().min(1).nullable().optional(),
  supportDeityIds: z.array(z.string().trim().min(1)).max(2).optional()
});

export async function POST(request: Request) {
  const parsedBody = createRoomSchema.safeParse(await request.json());

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

  try {
    const user = await requireUser(supabase);

    const rateLimited = await enforceRateLimit(supabase, user.id, 'rooms:create');
    if (rateLimited) return rateLimited;

    const { hallId, primaryDeityId, supportDeityIds, ...roomInput } = parsedBody.data;

    // Only validate against the catalog if the client actually picked a
    // hall — if hallId is omitted, createRoomForUser resolves the default
    // Hall itself (already guaranteed valid, no need to re-check it here).
    if (hallId !== undefined) {
      const deitySelection = await validateDeitySelection(supabase, {
        hallId,
        primaryDeityId: primaryDeityId ?? null,
        supportDeityIds: supportDeityIds ?? []
      });

      if (!deitySelection.valid) {
        return NextResponse.json({ error: deitySelection.error }, { status: 400 });
      }
    }

    const { room } = await createRoomForUser(supabase, {
      ...roomInput,
      hallId,
      primaryDeityId: primaryDeityId ?? null,
      supportDeityIds: supportDeityIds ?? []
    });

    return NextResponse.json(
      {
        user: { id: user.id },
        room
      },
      { status: 201 }
    );
  } catch (cause) {
    if (cause instanceof RoomServiceError) {
      const status = cause.code === 'UNAUTHORIZED' ? 401 : 500;
      return NextResponse.json({ error: cause.code }, { status });
    }

    throw cause;
  }
}
