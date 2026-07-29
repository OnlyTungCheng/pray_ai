import { NextResponse } from "next/server";
import { z } from "zod";

import { createClient } from "@/lib/supabase/server";
import { enforceRateLimit } from "@/lib/rate-limit";
import { isValidAvatarId } from "@/features/avatars/avatar-catalog";
import { MAX_SEAT_SLOTS, isValidSeatSlot } from "@/features/temple-room/seat-config";

const claimSeatSchema = z.object({
  seatSlot: z.number().int(),
  avatarId: z.string().optional(),
});

type RouteContext = {
  params: Promise<{
    roomId: string;
  }>;
};

/**
 * Claims (or switches to) a seat slot for the authenticated user in this
 * room. See docs/prd-chibi-avatar-seats.md §3 for why this must be an atomic
 * server-side RPC (claim_seat_slot) rather than a client-decided Presence
 * value — two users could otherwise both believe they won the same slot.
 */
export async function POST(request: Request, context: RouteContext) {
  const { roomId } = await context.params;

  const parsedBody = claimSeatSchema.safeParse(await request.json());

  if (!parsedBody.success) {
    return NextResponse.json(
      {
        error: "INVALID_REQUEST",
        details: parsedBody.error.flatten(),
      },
      { status: 400 },
    );
  }

  const { seatSlot, avatarId } = parsedBody.data;

  if (!isValidSeatSlot(seatSlot)) {
    return NextResponse.json({ error: "INVALID_SLOT" }, { status: 400 });
  }

  if (avatarId !== undefined && !isValidAvatarId(avatarId)) {
    return NextResponse.json({ error: "INVALID_AVATAR_ID" }, { status: 400 });
  }

  const supabase = await createClient();

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
  }

  // Dedicated rate limit — separate from rooms:actions, since seat
  // switching is its own low-frequency interaction, not a ritual action.
  //
  // Runs in parallel with the membership check below — both are
  // independent reads (different tables, neither depends on the other's
  // result), so there's no correctness reason to wait for one before
  // starting the other.
  const [rateLimited, membershipResult] = await Promise.all([
    enforceRateLimit(supabase, user.id, "rooms:seat", {
      maxRequests: 10,
      windowSeconds: 10,
    }),
    supabase
      .from("room_members")
      .select("room_id")
      .eq("room_id", roomId)
      .eq("user_id", user.id)
      .maybeSingle()
  ]);

  if (rateLimited) return rateLimited;

  // Must already be a room member (i.e. have joined via /join) before
  // claiming a seat — mirrors the membership check RLS itself enforces on
  // room_members writes, checked explicitly here so we can return a clear
  // error instead of a generic RPC failure.
  const { data: membership, error: membershipError } = membershipResult;

  if (membershipError) {
    return NextResponse.json({ error: "MEMBERSHIP_QUERY_FAILED" }, { status: 500 });
  }

  if (!membership) {
    return NextResponse.json({ error: "NOT_A_ROOM_MEMBER" }, { status: 403 });
  }

  // Persist the chosen avatar (if provided) before claiming the seat, so a
  // successful claim always has a consistent avatar_id alongside it. Done as
  // a separate statement (not inside the RPC) since avatar choice can also
  // be changed independently of seating — see docs/prd-chibi-avatar-seats.md §4.
  if (avatarId !== undefined) {
    const { error: avatarUpdateError } = await supabase
      .from("room_members")
      .update({ avatar_id: avatarId })
      .eq("room_id", roomId)
      .eq("user_id", user.id);

    if (avatarUpdateError) {
      return NextResponse.json({ error: "AVATAR_UPDATE_FAILED" }, { status: 500 });
    }
  }

  const { data: claimResult, error: rpcError } = await supabase
    .rpc("claim_seat_slot", {
      p_room_id: roomId,
      p_user_id: user.id,
      p_seat_slot: seatSlot,
      p_max_slots: MAX_SEAT_SLOTS,
    })
    .single();

  if (rpcError || !claimResult) {
    console.error("claim_seat_slot RPC failed:", { roomId, seatSlot, rpcError });
    return NextResponse.json({ error: "SEAT_CLAIM_FAILED" }, { status: 500 });
  }

  const { success, reason } = claimResult as { success: boolean; reason: string | null };

  if (!success) {
    // SLOT_TAKEN is a normal contention outcome (two users clicking the same
    // seat), not a server error — 409 tells the client to let the user pick
    // a different slot, rather than showing a generic failure.
    const status = reason === "INVALID_SLOT" ? 400 : 409;
    return NextResponse.json({ error: reason ?? "SEAT_CLAIM_REJECTED" }, { status });
  }

  return NextResponse.json({ accepted: true, seatSlot, avatarId: avatarId ?? null }, { status: 200 });
}

/**
 * Stands up — releases the caller's current seat (and clears avatar_id, per
 * release_seat_slot's definition). Best-effort: a client may not always get
 * the chance to call this (e.g. hard tab close), which is why
 * room_members.seat_slot is documented as a "best-known-state" value, with
 * Presence being the authoritative live view (see PRD §3.5).
 */
export async function DELETE(_request: Request, context: RouteContext) {
  const { roomId } = await context.params;

  const supabase = await createClient();

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
  }

  const { error: rpcError } = await supabase.rpc("release_seat_slot", {
    p_room_id: roomId,
    p_user_id: user.id,
  });

  if (rpcError) {
    console.error("release_seat_slot RPC failed:", { roomId, rpcError });
    return NextResponse.json({ error: "SEAT_RELEASE_FAILED" }, { status: 500 });
  }

  return NextResponse.json({ released: true }, { status: 200 });
}
