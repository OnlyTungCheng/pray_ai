import { NextResponse } from 'next/server';
import { z } from 'zod';

import { createClient } from '@/lib/supabase/server';
import { enforceRateLimit } from '@/lib/rate-limit';
import { createRoomForUser, requireUser, RoomServiceError } from '@/features/temple-room/room-service';

const createRoomSchema = z.object({
  projectName: z.string().trim().min(1).max(80),
  eventType: z.enum(['build', 'deploy', 'migration', 'release']),
  prayer: z.string().trim().min(1).max(280),
  title: z.string().trim().min(1).max(120).optional(),
  description: z.string().trim().max(280).optional()
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

    const { room } = await createRoomForUser(supabase, parsedBody.data);

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
