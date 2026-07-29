import { NextResponse } from "next/server";
import { z } from "zod";

import { createClient } from "@/lib/supabase/server";
import { enforceRateLimit } from "@/lib/rate-limit";

const roomActionSchema = z.object({
  eventId: z.string().uuid(),

  type: z.enum([
    "light_incense",
    "ring_bell",
    "start_praying",
    "finish_praying",
    "reaction",
  ]),

  payload: z
    .record(z.string(), z.unknown())
    .optional()
    .default({}),
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

  const parsedBody = roomActionSchema.safeParse(
    await request.json(),
  );

  if (!parsedBody.success) {
    return NextResponse.json(
      {
        error: "INVALID_ACTION",
        details: parsedBody.error.flatten(),
      },
      {
        status: 400,
      },
    );
  }

  const supabase = await createClient();

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return NextResponse.json(
      {
        error: "UNAUTHORIZED",
      },
      {
        status: 401,
      },
    );
  }

  // Generic per-endpoint rate limit (separate layer from the 250ms
  // between-clicks cooldown below): caps total room-action requests per
  // minute so a single user can't hammer this endpoint indefinitely, while
  // still allowing a normal ritual session's worth of clicking.
  const genericRateLimited = await enforceRateLimit(supabase, user.id, "rooms:actions", {
    maxRequests: 20,
    windowSeconds: 60
  });
  if (genericRateLimited) return genericRateLimited;

  // Rate limit: guards against rapid-fire distinct eventIds from the same
  // user (bug or abuse), separate from the eventId-PK idempotency check below
  // which only catches exact retries. 250ms is generous enough for normal
  // clicking/tapping while still keeping room counters meaningful.
  const { data: withinRateLimit, error: rateLimitError } = await supabase.rpc(
    "check_room_action_rate_limit",
    {
      p_room_id: roomId,
      p_user_id: user.id,
    },
  );

  if (rateLimitError) {
    return NextResponse.json(
      {
        error: "RATE_LIMIT_CHECK_FAILED",
      },
      {
        status: 500,
      },
    );
  }

  if (!withinRateLimit) {
    return NextResponse.json(
      {
        error: "RATE_LIMITED",
      },
      {
        status: 429,
      },
    );
  }

  // Idempotency guard: eventId is the primary key, so a duplicate insert
  // (e.g. a retried request after a dropped response) fails with 23505
  // instead of double-recording the action.
  const { error: insertError } = await supabase
    .from("room_actions")
    .insert({
      id: parsedBody.data.eventId,
      room_id: roomId,
      user_id: user.id,
      action_type: parsedBody.data.type,
      payload: parsedBody.data.payload,
    });

  const isDuplicate = insertError?.code === "23505";

  if (insertError && !isDuplicate) {
    return NextResponse.json(
      {
        error: "ACTION_REJECTED",
      },
      {
        status: 403,
      },
    );
  }

  // Atomically increment room counters (see apply_room_action in
  // supabase/migrations/0002_apply_room_action_rpc.sql) — this runs even on a
  // duplicate action-record insert being skipped, because a duplicate means
  // the *record* already exists, but we still want a consistent room snapshot
  // to return. We only re-apply counters for genuinely new actions to avoid
  // double-counting a retried request.
  let room: {
    id: string;
    title: string;
    projectName: string;
    eventType: "build" | "deploy" | "migration" | "release";
    prayer: string;
    status: "waiting" | "praying" | "completed";
    incenseCount: number;
    bellCount: number;
    prayerCount: number;
    energy: number;
    revision: number;
  } | null = null;

  if (!isDuplicate) {
    const { data: updatedRoom, error: rpcError } = await supabase.rpc(
      "apply_room_action",
      {
        p_room_id: roomId,
        p_action_type: parsedBody.data.type,
      },
    );

    if (rpcError || !updatedRoom) {
      return NextResponse.json(
        {
          error: "ROOM_UPDATE_FAILED",
        },
        {
          status: 500,
        },
      );
    }

    // The RPC returns the raw `rooms` row (snake_case); map it to the
    // camelCase RoomSnapshot shape the realtime client expects.
    room = {
      id: updatedRoom.id,
      title: updatedRoom.title,
      projectName: updatedRoom.project_name,
      eventType: updatedRoom.event_type,
      prayer: updatedRoom.prayer,
      status: updatedRoom.status,
      incenseCount: updatedRoom.incense_count,
      bellCount: updatedRoom.bell_count,
      prayerCount: updatedRoom.prayer_count,
      energy: updatedRoom.energy,
      revision: updatedRoom.revision,
    };
  }

  // Broadcast so every connected client (including the sender, per
  // broadcast.self: true in useTempleRoom) receives the same authoritative
  // room snapshot and can replay the local animation for this action.
  if (room) {
    const channel = supabase.channel(`room:${roomId}`, {
      config: { private: true },
    });

    await channel.send({
      type: "broadcast",
      event: "room-action",
      payload: {
        eventId: parsedBody.data.eventId,
        actorId: user.id,
        actionType: parsedBody.data.type,
        actionPayload: parsedBody.data.payload,
        createdAt: new Date().toISOString(),
        room,
      },
    });

    await supabase.removeChannel(channel);
  }

  return NextResponse.json(
    {
      accepted: true,
      duplicated: isDuplicate,
      room,
    },
    {
      status: 202,
    },
  );
}
