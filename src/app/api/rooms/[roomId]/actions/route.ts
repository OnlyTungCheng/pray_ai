import { NextResponse } from "next/server";
import { z } from "zod";

import { createClient } from "@/lib/supabase/server";
import { enforceRateLimit } from "@/lib/rate-limit";
import { isValidOfferingId } from "@/features/offerings/offering-catalog";

const roomActionSchema = z.object({
  eventId: z.string().uuid(),

  type: z.enum([
    "light_incense",
    "ring_bell",
    "start_praying",
    "finish_praying",
    "reaction",
    "clear_incense",
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
  // between-clicks cooldown below) and the cooldown check's own RPC call
  // are fully independent reads — different tables, no shared state, and
  // neither depends on the other's result to know what to check. Running
  // them via Promise.all instead of two sequential awaits removes one full
  // network round-trip from this hot path (every thắp hương/gõ chuông
  // click goes through this route). Both results are inspected below once
  // both have settled.
  const [genericRateLimited, cooldownCheck] = await Promise.all([
    enforceRateLimit(supabase, user.id, "rooms:actions", {
      maxRequests: 20,
      windowSeconds: 60
    }),
    supabase.rpc("check_room_action_rate_limit", {
      p_room_id: roomId,
      p_user_id: user.id,
    })
  ]);

  if (genericRateLimited) return genericRateLimited;

  const { data: withinRateLimit, error: rateLimitError } = cooldownCheck;

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

  // "Dâng lễ vật" (offerings) piggy-backs on the generic `reaction` action
  // type via payload.offering — validate the id server-side against the
  // same whitelist enforced at the DB layer (room_offerings.offering_id
  // check constraint, see schema/0011_offering_counter.sql). A request with
  // an unrecognized offering id is rejected outright rather than silently
  // falling back to a plain reaction, so the client can't smuggle arbitrary
  // strings into the offerings log.
  const rawOfferingId = parsedBody.data.payload.offering;
  let offeringId: string | null = null;

  if (parsedBody.data.type === "reaction" && rawOfferingId !== undefined) {
    if (!isValidOfferingId(rawOfferingId)) {
      return NextResponse.json(
        {
          error: "INVALID_OFFERING_ID",
        },
        {
          status: 400,
        },
      );
    }

    offeringId = rawOfferingId;

    // Dedicated, higher-frequency rate limit for offerings specifically —
    // separate from the generic 20/min actions cap above, matching the
    // product doc's original reaction guidance (10 per 10s) rather than the
    // more conservative per-minute cap meant for all room actions combined.
    // Cannot be parallelized with the two checks above: it's conditional on
    // parsedBody.data.type/payload.offering, which are already known at
    // that point, but there's no benefit to starting it earlier since it
    // only matters for the (less common) offering path.
    const offeringRateLimited = await enforceRateLimit(supabase, user.id, "rooms:offer", {
      maxRequests: 10,
      windowSeconds: 10
    });
    if (offeringRateLimited) return offeringRateLimited;
  }

  // Idempotency guard: eventId is the primary key, so a duplicate insert
  // (e.g. a retried request after a dropped response) fails with 23505
  // instead of double-recording the action.
  const { data: insertedAction, error: insertError } = await supabase
    .from("room_actions")
    .insert({
      id: parsedBody.data.eventId,
      room_id: roomId,
      user_id: user.id,
      action_type: parsedBody.data.type,
      payload: parsedBody.data.payload,
    })
    .select("created_at")
    .maybeSingle();

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
    offeringCount: number;
    energy: number;
    revision: number;
  } | null = null;

  if (!isDuplicate) {
    const { data: updatedRoom, error: rpcError } = await supabase.rpc(
      "apply_room_action",
      {
        p_room_id: roomId,
        p_action_type: parsedBody.data.type,
        p_offering_id: offeringId,
      },
    );

    if (rpcError || !updatedRoom) {
      console.error("apply_room_action RPC failed:", {
        roomId,
        actionType: parsedBody.data.type,
        rpcError,
        updatedRoom,
      });

      return NextResponse.json(
        {
          error: "ROOM_UPDATE_FAILED",
          details: rpcError?.message,
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
      offeringCount: updatedRoom.offering_count,
      energy: updatedRoom.energy,
      revision: updatedRoom.revision,
    };

    // Log the individual offering (which item, by whom) and broadcast the
    // updated room snapshot to every connected client — these two side
    // effects are fully independent of each other (one writes to
    // room_offerings, the other posts to the Realtime broadcast endpoint;
    // neither reads the other's result), so running them concurrently
    // instead of one after the other removes another full round-trip from
    // this hot path. A failure in either is logged but does not fail the
    // request — apply_room_action above already succeeded and is the
    // authoritative state; the offering log and the broadcast are both
    // secondary (stats / live-UI-sync) effects, not core to the ritual
    // action actually having been recorded.
    const sideEffects: PromiseLike<void>[] = [];

    if (offeringId) {
      sideEffects.push(
        supabase
          .from("room_offerings")
          .insert({
            id: parsedBody.data.eventId,
            room_id: roomId,
            user_id: user.id,
            offering_id: offeringId,
          })
          .then(({ error: offeringLogError }) => {
            if (offeringLogError && offeringLogError.code !== "23505") {
              console.error("Failed to log room offering:", offeringLogError);
            }
          })
      );
    }

    // Broadcast so every connected client (including the sender, per
    // broadcast.self: true in useTempleRoom) receives the same authoritative
    // room snapshot and can replay the local animation for this action.
    // `channel.send()` without a prior `.subscribe()` uses a single REST
    // call under the hood (no WebSocket handshake), so this is one HTTP
    // round-trip, not a persistent connection being opened per request.
    const channel = supabase.channel(`room:${roomId}`, {
      config: { private: true },
    });

    sideEffects.push(
      Promise.resolve(
        channel.send({
          type: "broadcast",
          event: "room-action",
          payload: {
            eventId: parsedBody.data.eventId,
            actorId: user.id,
            actionType: parsedBody.data.type,
            actionPayload: parsedBody.data.payload,
            createdAt: insertedAction?.created_at ?? new Date().toISOString(),
            room,
          },
        })
      )
        .then(() => supabase.removeChannel(channel))
        .then(() => undefined)
    );

    await Promise.all(sideEffects);
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
