import { NextResponse } from "next/server";
import { z } from "zod";

import { createClient } from "@/lib/supabase/server";
import { enforceRateLimit } from "@/lib/rate-limit";
import { joinRoomForUser, requireUser, RoomServiceError } from "@/features/temple-room/room-service";

const joinRoomSchema = z.object({
  displayName: z
    .string()
    .trim()
    .min(1)
    .max(30),
});

type RouteContext = {
  params: Promise<{
    roomId: string;
  }>;
};

export async function POST(
  request: Request,
  context: RouteContext,
) {
  const { roomId } = await context.params;

  const parsedBody = joinRoomSchema.safeParse(
    await request.json(),
  );

  if (!parsedBody.success) {
    return NextResponse.json(
      {
        error: "INVALID_REQUEST",
        details: parsedBody.error.flatten(),
      },
      {
        status: 400,
      },
    );
  }

  const supabase = await createClient();

  try {
    const user = await requireUser(supabase);

    const rateLimited = await enforceRateLimit(supabase, user.id, "rooms:join");
    if (rateLimited) return rateLimited;

    const { room } = await joinRoomForUser(
      supabase,
      roomId,
      parsedBody.data.displayName,
    );

    return NextResponse.json({
      user: {
        id: user.id,
        displayName: parsedBody.data.displayName,
      },
      room,
    });
  } catch (cause) {
    if (cause instanceof RoomServiceError) {
      const statusByCode: Record<RoomServiceError["code"], number> = {
        UNAUTHORIZED: 401,
        ROOM_NOT_FOUND: 404,
        ROOM_QUERY_FAILED: 500,
        JOIN_FAILED: 500,
        CREATE_FAILED: 500,
      };

      return NextResponse.json(
        { error: cause.code },
        { status: statusByCode[cause.code] },
      );
    }

    throw cause;
  }
}
