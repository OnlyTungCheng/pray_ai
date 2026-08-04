import { NextResponse } from "next/server";
import { z } from "zod";

import { createClient } from "@/lib/supabase/server";
import { enforceRateLimit } from "@/lib/rate-limit";
import { isReadinessCheckKey } from "@/features/readiness/score-readiness";
import { assertReadinessMember, ReadinessServiceError, getProjectReadiness, updateProjectReadiness } from "@/features/readiness/readiness-service";
import type { ReadinessCheckKey } from "@/features/readiness/types";

type RouteContext = { params: Promise<{ roomId: string }> };
const updateSchema = z.object({
  checkKey: z.string(),
  status: z.enum(["pass", "warn", "fail", "unknown"]),
  note: z.string().trim().max(280).nullable().optional(),
});

function errorResponse(error: unknown) {
  if (error instanceof ReadinessServiceError) {
    const status = error.code === "NOT_A_ROOM_MEMBER" ? 403 : 500;
    return NextResponse.json({ error: error.code }, { status });
  }
  return NextResponse.json({ error: "READINESS_FAILED" }, { status: 500 });
}

async function getUser() {
  const supabase = await createClient();
  const { data: { user }, error } = await supabase.auth.getUser();
  return { supabase, user: error || !user ? null : user };
}

export async function GET(_request: Request, context: RouteContext) {
  const { roomId } = await context.params;
  const { supabase, user } = await getUser();
  if (!user) return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
  try {
    await assertReadinessMember(supabase, roomId, user.id);
    return NextResponse.json(await getProjectReadiness(supabase, roomId));
  } catch (error) {
    return errorResponse(error);
  }
}

export async function PATCH(request: Request, context: RouteContext) {
  const { roomId } = await context.params;
  const parsed = updateSchema.safeParse(await request.json());
  if (!parsed.success || !isReadinessCheckKey(parsed.data?.checkKey ?? "")) return NextResponse.json({ error: "INVALID_READINESS_CHECK" }, { status: 400 });
  const { supabase, user } = await getUser();
  if (!user) return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
  const rateLimited = await enforceRateLimit(supabase, user.id, "rooms:readiness", { maxRequests: 20, windowSeconds: 60 });
  if (rateLimited) return rateLimited;
  try {
    await updateProjectReadiness(supabase, { roomId, userId: user.id, checkKey: parsed.data.checkKey as ReadinessCheckKey, status: parsed.data.status, note: parsed.data.note ?? null });
    return NextResponse.json({ accepted: true });
  } catch (error) {
    return errorResponse(error);
  }
}
