import { NextResponse } from "next/server";
import { z } from "zod";

import { createClient } from "@/lib/supabase/server";
import { enforceRateLimit } from "@/lib/rate-limit";
import { validateDeitySelection } from "@/features/halls/hall-catalog-service";

const switchHallSchema = z.object({
  hallId: z.string().uuid(),
  // Deity slugs from the hardcoded deity-catalog.ts (e.g. "vercel"), not
  // database ids — Deity is not a DB table (schema/0016).
  primaryDeityId: z.string().trim().min(1).nullable().optional(),
  supportDeityIds: z.array(z.string().trim().min(1)).max(2).optional(),
});

type RouteContext = {
  params: Promise<{
    roomId: string;
  }>;
};

/**
 * Switches a room's Hall (Điện) — and optionally its primary/support
 * deities — after the room has already been created. Per docs/than.md §4
 * (revised flow): picking a Hall is never required to create a room (a
 * default is auto-assigned, see createRoomForUser); this route is what
 * lets a room's header UI offer "chuyển Điện" afterwards.
 *
 * Always requires switching TO a hall — there is no "clear hall" action
 * here, since every room should always render with some Hall context per
 * the revised flow (the one exception, the hall-less system lobby, is
 * seeded directly by SQL and never goes through this route).
 */
export async function PATCH(request: Request, context: RouteContext) {
  const { roomId } = await context.params;

  const parsedBody = switchHallSchema.safeParse(await request.json());

  if (!parsedBody.success) {
    return NextResponse.json(
      {
        error: "INVALID_REQUEST",
        details: parsedBody.error.flatten(),
      },
      { status: 400 },
    );
  }

  const { hallId, primaryDeityId, supportDeityIds } = parsedBody.data;

  const supabase = await createClient();

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
  }

  // Dedicated rate limit — switching halls is an infrequent header action,
  // not a ritual action, so it gets its own generous-but-bounded quota
  // rather than sharing rooms:actions.
  //
  // Runs in parallel with the membership check below — both are
  // independent reads, so there's no correctness reason to wait for one
  // before starting the other.
  const [rateLimited, membershipResult] = await Promise.all([
    enforceRateLimit(supabase, user.id, "rooms:switch-hall", {
      maxRequests: 10,
      windowSeconds: 60,
    }),
    supabase
      .from("room_members")
      .select("room_id")
      .eq("room_id", roomId)
      .eq("user_id", user.id)
      .maybeSingle()
  ]);

  if (rateLimited) return rateLimited;

  // Must be a member of this room to change its hall — mirrors the seat
  // route's membership check, and the rooms UPDATE RLS policy (0010) which
  // already only allows room_members to update their own room's row.
  const { data: membership, error: membershipError } = membershipResult;

  if (membershipError) {
    return NextResponse.json({ error: "MEMBERSHIP_QUERY_FAILED" }, { status: 500 });
  }

  if (!membership) {
    return NextResponse.json({ error: "NOT_A_ROOM_MEMBER" }, { status: 403 });
  }

  const deitySelection = await validateDeitySelection(supabase, {
    hallId,
    primaryDeityId: primaryDeityId ?? null,
    supportDeityIds: supportDeityIds ?? [],
  });

  if (!deitySelection.valid) {
    return NextResponse.json({ error: deitySelection.error }, { status: 400 });
  }

  const { data: updatedRoom, error: updateError } = await supabase
    .from("rooms")
    .update({
      hall_id: hallId,
      primary_deity_id: primaryDeityId ?? null,
      support_deity_ids: supportDeityIds ?? [],
    })
    .eq("id", roomId)
    .select("id, hall_id, primary_deity_id, support_deity_ids")
    .maybeSingle();

  if (updateError) {
    // The check_room_deities_belong_to_hall trigger (schema/0016) is a
    // second, defense-in-depth validation layer — if it ever rejects a
    // selection that validateDeitySelection() above already approved (a
    // logic drift between the two), surface it as a 400, not a 500: it's
    // still a client-input problem, not a server fault.
    return NextResponse.json({ error: "HALL_SWITCH_REJECTED", details: updateError.message }, { status: 400 });
  }

  if (!updatedRoom) {
    return NextResponse.json({ error: "ROOM_NOT_FOUND" }, { status: 404 });
  }

  return NextResponse.json(
    {
      room: {
        id: updatedRoom.id,
        hallId: updatedRoom.hall_id,
        primaryDeityId: updatedRoom.primary_deity_id,
        supportDeityIds: updatedRoom.support_deity_ids ?? [],
      },
    },
    { status: 200 },
  );
}
