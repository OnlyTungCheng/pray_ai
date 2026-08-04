import type { SupabaseClient } from "@supabase/supabase-js";

import { drawOracle } from "@/features/oracle/draw-oracle";
import type { OracleResult } from "@/features/oracle/types";
import { buildReadinessSnapshot } from "./score-readiness";
import { assertReleaseSteward, assertRoomMember, RoomAuthorityError } from "@/features/room-authority/room-authority";
import type {
  LaunchRitualRun,
  ProjectReadinessCheck,
  ProjectReadinessSnapshot,
  ReadinessCheckKey,
  ReadinessStatus,
} from "./types";

export class ReadinessServiceError extends Error {
  constructor(
    message: string,
    public readonly code:
      | "NOT_A_ROOM_MEMBER"
      | "NOT_RELEASE_STEWARD"
      | "READINESS_FETCH_FAILED"
      | "READINESS_UPDATE_FAILED"
      | "RITUAL_CONTEXT_FAILED"
      | "READINESS_BLOCKED"
      | "RITUAL_PERSIST_FAILED",
  ) {
    super(message);
    this.name = "ReadinessServiceError";
  }
}

function mapCheck(row: Record<string, unknown>): Partial<ProjectReadinessCheck> {
  return {
    key: row.check_key as ReadinessCheckKey,
    status: row.status as ReadinessStatus,
    note: row.note as string | null,
    source: row.source as ProjectReadinessCheck["source"],
    updatedAt: row.updated_at as string | null,
    updatedBy: row.updated_by as string | null,
  };
}

function mapRun(row: Record<string, unknown>): LaunchRitualRun {
  const oracle = row.oracle_results as { tier?: string } | null | undefined;
  return {
    id: String(row.id),
    createdAt: String(row.created_at),
    initiatedBy: String(row.initiated_by),
    readinessScore: Number(row.readiness_score),
    riskAccepted: Boolean(row.risk_accepted),
    note: row.note as string | null,
    oracleResultId: row.oracle_result_id as string | null,
    oracleTier: oracle?.tier ?? null,
  };
}

function mapOracle(row: Record<string, unknown>): OracleResult {
  return {
    id: String(row.id),
    tier: row.tier as OracleResult["tier"],
    eventType: row.event_type as OracleResult["eventType"],
    message: String(row.message),
    disclaimer: "Kết quả chỉ mang tính giải trí. CI/CD vẫn nên dựa vào test, monitoring và rollback plan.",
    createdAt: String(row.created_at),
  };
}

export async function assertReadinessMember(supabase: SupabaseClient, roomId: string, userId: string) {
  try {
    return await assertRoomMember(supabase, roomId, userId);
  } catch (error) {
    throw new ReadinessServiceError("User is not a room member", error instanceof RoomAuthorityError ? error.code : "NOT_A_ROOM_MEMBER");
  }
}

export async function getProjectReadiness(
  supabase: SupabaseClient,
  roomId: string,
): Promise<ProjectReadinessSnapshot> {
  const [checksResult, runsResult] = await Promise.all([
    supabase.from("project_readiness_checks").select("*").eq("room_id", roomId),
    supabase.from("project_ritual_runs").select("*, oracle_results(tier)").eq("room_id", roomId).order("created_at", { ascending: false }).limit(6),
  ]);
  if (checksResult.error || runsResult.error) throw new ReadinessServiceError("Readiness fetch failed", "READINESS_FETCH_FAILED");
  return buildReadinessSnapshot(
    (checksResult.data ?? []).map((row) => mapCheck(row as Record<string, unknown>)),
    (runsResult.data ?? []).map((row) => mapRun(row as Record<string, unknown>)),
  );
}

export async function updateProjectReadiness(
  supabase: SupabaseClient,
  input: { roomId: string; userId: string; checkKey: ReadinessCheckKey; status: ReadinessStatus; note: string | null },
) {
  try { await assertReleaseSteward(supabase, input.roomId, input.userId); }
  catch (error) { throw new ReadinessServiceError("User cannot update readiness", error instanceof RoomAuthorityError ? error.code : "NOT_RELEASE_STEWARD"); }
  const { error } = await supabase.from("project_readiness_checks").upsert({
    room_id: input.roomId,
    check_key: input.checkKey,
    status: input.status,
    note: input.note,
    source: "manual",
    updated_by: input.userId,
    updated_at: new Date().toISOString(),
  }, { onConflict: "room_id,check_key" });
  if (error) throw new ReadinessServiceError("Readiness update failed", "READINESS_UPDATE_FAILED");
}

export async function launchProjectRitual(
  supabase: SupabaseClient,
  input: { roomId: string; userId: string; ritualId: string; riskAccepted: boolean; note: string | null },
) {
  try { await assertReleaseSteward(supabase, input.roomId, input.userId); }
  catch (error) { throw new ReadinessServiceError("User cannot launch ritual", error instanceof RoomAuthorityError ? error.code : "NOT_RELEASE_STEWARD"); }
  const [roomResult, snapshot] = await Promise.all([
    supabase.from("rooms").select("event_type").eq("id", input.roomId).maybeSingle(),
    getProjectReadiness(supabase, input.roomId),
  ]);
  if (roomResult.error || !roomResult.data) throw new ReadinessServiceError("Ritual context failed", "RITUAL_CONTEXT_FAILED");
  if (snapshot.blockers.length && !input.riskAccepted) throw new ReadinessServiceError("Readiness is blocked", "READINESS_BLOCKED");

  const result = drawOracle({ eventType: roomResult.data.event_type });
  const { data, error } = await supabase.rpc("launch_project_ritual", {
    p_run_id: input.ritualId,
    p_room_id: input.roomId,
    p_user_id: input.userId,
    p_readiness_score: snapshot.score,
    p_readiness_snapshot: snapshot.checks,
    p_risk_accepted: input.riskAccepted,
    p_note: input.note,
    p_oracle_id: result.id,
    p_oracle_tier: result.tier,
    p_event_type: result.eventType,
    p_message: result.message,
  });
  if (error?.message.includes("NOT_RELEASE_STEWARD")) throw new ReadinessServiceError("User cannot launch ritual", "NOT_RELEASE_STEWARD");
  if (error || !data) throw new ReadinessServiceError("Ritual persistence failed", "RITUAL_PERSIST_FAILED");
  const payload = data as { run: Record<string, unknown>; result: Record<string, unknown> };
  return { readiness: snapshot, run: payload.run, result: mapOracle(payload.result) };
}
