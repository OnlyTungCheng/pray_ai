import type { SupabaseClient } from "@supabase/supabase-js";

export type RoomMemberRole = "owner" | "maintainer" | "participant";

export class RoomAuthorityError extends Error {
  constructor(public readonly code: "NOT_A_ROOM_MEMBER" | "NOT_RELEASE_STEWARD") {
    super(code);
    this.name = "RoomAuthorityError";
  }
}

export async function assertRoomMember(
  supabase: SupabaseClient,
  roomId: string,
  userId: string,
): Promise<RoomMemberRole> {
  const { data, error } = await supabase
    .from("room_members")
    .select("role")
    .eq("room_id", roomId)
    .eq("user_id", userId)
    .maybeSingle();
  if (error || !data) throw new RoomAuthorityError("NOT_A_ROOM_MEMBER");
  return (data.role ?? "participant") as RoomMemberRole;
}

export async function assertReleaseSteward(
  supabase: SupabaseClient,
  roomId: string,
  userId: string,
): Promise<"owner" | "maintainer"> {
  const role = await assertRoomMember(supabase, roomId, userId);
  if (role !== "owner" && role !== "maintainer") throw new RoomAuthorityError("NOT_RELEASE_STEWARD");
  return role;
}
