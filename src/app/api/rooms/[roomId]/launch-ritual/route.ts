import { NextResponse } from "next/server";
import { z } from "zod";

import { createClient } from "@/lib/supabase/server";
import { enforceRateLimit } from "@/lib/rate-limit";
import { launchProjectRitual, ReadinessServiceError } from "@/features/readiness/readiness-service";

const launchSchema = z.object({
  eventId: z.string().uuid(),
  riskAccepted: z.boolean().default(false),
  note: z.string().trim().max(280).nullable().optional(),
});
type RouteContext = { params: Promise<{ roomId: string }> };

function errorResponse(error: unknown) {
  if (error instanceof ReadinessServiceError) {
    const status = error.code === "NOT_A_ROOM_MEMBER" || error.code === "NOT_RELEASE_STEWARD" ? 403 : error.code === "READINESS_BLOCKED" ? 409 : 500;
    return NextResponse.json({ error: error.code }, { status });
  }
  return NextResponse.json({ error: "RITUAL_FAILED" }, { status: 500 });
}

export async function POST(request: Request, context: RouteContext) {
  const { roomId } = await context.params;
  const parsed = launchSchema.safeParse(await request.json());
  if (!parsed.success) return NextResponse.json({ error: "INVALID_RITUAL_REQUEST" }, { status: 400 });
  const supabase = await createClient();
  const { data: { user }, error: userError } = await supabase.auth.getUser();
  if (userError || !user) return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
  const rateLimited = await enforceRateLimit(supabase, user.id, "rooms:launch-ritual", { maxRequests: 3, windowSeconds: 60 });
  if (rateLimited) return rateLimited;
  try {
    const result = await launchProjectRitual(supabase, { roomId, userId: user.id, ritualId: parsed.data.eventId, riskAccepted: parsed.data.riskAccepted, note: parsed.data.note ?? null });
    return NextResponse.json({ accepted: true, ...result }, { status: 201 });
  } catch (error) {
    return errorResponse(error);
  }
}
