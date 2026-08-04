import type { SupabaseClient } from "@supabase/supabase-js";

import { drawOracle } from "@/features/oracle/draw-oracle";
import type { OracleResult, PrayerEventType } from "@/features/oracle/types";

const ROOM_EVENT_TYPES = ["build", "deploy", "migration", "release"] as const;
type RoomEventType = (typeof ROOM_EVENT_TYPES)[number];

export class PrayerCompletionError extends Error {
  constructor(
    message: string,
    public readonly code:
      | "ROOM_QUERY_FAILED"
      | "ROOM_NOT_FOUND"
      | "NOT_A_ROOM_MEMBER"
      | "COMPLETION_FAILED",
  ) {
    super(message);
    this.name = "PrayerCompletionError";
  }
}

type CompletionRpcResult = {
  accepted: boolean;
  duplicated: boolean;
  room: Record<string, unknown>;
  result: Record<string, unknown>;
};

export type PrayerCompletion = Omit<CompletionRpcResult, "result"> & { result: OracleResult };

function mapOracleResult(row: Record<string, unknown>): OracleResult {
  return {
    id: String(row.id),
    tier: row.tier as OracleResult["tier"],
    eventType: row.event_type as OracleResult["eventType"],
    message: String(row.message),
    disclaimer: "Kết quả chỉ mang tính giải trí. CI/CD vẫn nên dựa vào test, monitoring và rollback plan.",
    createdAt: String(row.created_at),
  };
}

function isRoomEventType(value: string): value is RoomEventType {
  return (ROOM_EVENT_TYPES as readonly string[]).includes(value);
}

/**
 * Completes a prayer with server-owned event selection and an idempotent RPC.
 * The browser supplies intent and payload only; it cannot choose the Oracle
 * event type or forge a result. Retrying the same eventId returns the same
 * persisted result.
 */
export async function completePrayerRitual(
  supabase: SupabaseClient,
  input: {
    roomId: string;
    userId: string;
    eventId: string;
    payload: Record<string, unknown>;
  },
): Promise<PrayerCompletion> {
  const { data: room, error: roomError } = await supabase
    .from("rooms")
    .select("event_type")
    .eq("id", input.roomId)
    .maybeSingle();

  if (roomError) {
    throw new PrayerCompletionError(roomError.message, "ROOM_QUERY_FAILED");
  }
  if (!room || !isRoomEventType(room.event_type)) {
    throw new PrayerCompletionError("Room was not found", "ROOM_NOT_FOUND");
  }

  const result = drawOracle({
    eventType: room.event_type as PrayerEventType,
  });

  const { data, error } = await supabase.rpc("complete_prayer_ritual", {
    p_room_id: input.roomId,
    p_user_id: input.userId,
    p_event_id: input.eventId,
    p_payload: input.payload,
    p_oracle_id: result.id,
    p_oracle_tier: result.tier,
    p_event_type: result.eventType,
    p_message: result.message,
  });

  if (error || !data) {
    if (error?.message.includes("NOT_A_ROOM_MEMBER")) {
      throw new PrayerCompletionError("User is not a room member", "NOT_A_ROOM_MEMBER");
    }
    throw new PrayerCompletionError(
      error?.message ?? "Prayer completion failed",
      "COMPLETION_FAILED",
    );
  }

  const raw = data as CompletionRpcResult;
  return { ...raw, result: mapOracleResult(raw.result) };
}
