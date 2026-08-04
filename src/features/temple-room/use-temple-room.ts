"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import type { RealtimeChannel } from "@supabase/supabase-js";

import { createClient } from "@/lib/supabase/client";
import { showApiErrorToast } from "@/lib/api-error-toast";
import type { RoomSnapshot as CanonicalRoomSnapshot } from "./room-projection";

export type RoomSnapshot = CanonicalRoomSnapshot;

export type Participant = {
  userId: string;
  displayName: string;
  activity: "idle" | "praying";
  joinedAt: string;
  /** Seat slot index (0..MAX_SEAT_SLOTS-1), or null if not seated. */
  seatSlot: number | null;
  /** Chosen chibi avatar id, or null if none chosen yet. */
  avatarId: string | null;
};

type RoomActionPayload = {
  eventId: string;
  actorId: string;

  actionType:
    | "light_incense"
    | "ring_bell"
    | "start_praying"
    | "finish_praying"
    | "reaction"
    | "clear_incense";

  actionPayload: Record<string, unknown>;
  createdAt: string;
  room: RoomSnapshot;
};

export type RoomActionType = RoomActionPayload["actionType"];

export type RoomActionResponse = {
  accepted: boolean;
  duplicated?: boolean;
  eventId: string;
  result?: { id: string };
  room?: RoomSnapshot | null;
};

type UseTempleRoomParams = {
  initialRoom: RoomSnapshot;
  user: {
    id: string;
    displayName: string;
  };
  onRealtimeAction?: (
    event: RoomActionPayload,
  ) => void;
};

export function useTempleRoom({
  initialRoom,
  user,
  onRealtimeAction,
}: UseTempleRoomParams) {
  const [room, setRoom] = useState(initialRoom);

  const [participants, setParticipants] = useState<
    Participant[]
  >([]);

  const [connectionStatus, setConnectionStatus] =
    useState<
      "connecting" | "connected" | "disconnected"
    >("connecting");

  const channelRef =
    useRef<RealtimeChannel | null>(null);

  const processedEventIdsRef = useRef(
    new Set<string>(),
  );

  // Tracks this client's own last-known presence fields (activity/seat/avatar)
  // across re-tracks (reconnects, updateActivity, updateSeat) — without this,
  // calling channel.track() again from updateActivity() would silently reset
  // seatSlot/avatarId back to null, since Presence has no partial-update
  // concept: each track() call replaces this client's entire presence state.
  const ownPresenceRef = useRef<{
    activity: Participant["activity"];
    seatSlot: number | null;
    avatarId: string | null;
  }>({ activity: "idle", seatSlot: null, avatarId: null });

  const applyRealtimeEvent = useCallback(
    (event: RoomActionPayload) => {
      if (
        processedEventIdsRef.current.has(event.eventId)
      ) {
        return;
      }

      processedEventIdsRef.current.add(event.eventId);

      setRoom((currentRoom) => {
        if (
          event.room.revision <= currentRoom.revision
        ) {
          return currentRoom;
        }

        return event.room;
      });

      onRealtimeAction?.(event);
    },
    [onRealtimeAction],
  );

  useEffect(() => {
    const supabase = createClient();

    const channel = supabase.channel(
      `room:${initialRoom.id}`,
      {
        config: {
          private: true,

          presence: {
            key: user.id,
          },

          broadcast: {
            ack: true,
            self: true,
          },
        },
      },
    );

    channel
      .on(
        "broadcast",
        {
          event: "room-action",
        },
        ({ payload }: any) => {
          applyRealtimeEvent(
            payload as RoomActionPayload,
          );
        },
      )
      .on(
        "presence",
        {
          event: "sync",
        },
        () => {
          const state = channel.presenceState();

          const nextParticipants =
            Object.values(state).flatMap(
              (entries) => entries,
            ) as unknown as Participant[];

          setParticipants(nextParticipants);
        },
      )
      .on(
        "presence",
        {
          event: "join",
        },
        () => {
          // Không nhất thiết phải xử lý riêng.
          // "sync" sẽ cập nhật snapshot đầy đủ.
        },
      )
      .on(
        "presence",
        {
          event: "leave",
        },
        () => {
          // "sync" sẽ cập nhật snapshot đầy đủ.
        },
      )
      .subscribe(async (status: string, error?: any) => {
        if (status === "SUBSCRIBED") {
          setConnectionStatus("connected");

          const trackResult = await channel.track({
            userId: user.id,
            displayName: user.displayName,
            activity: ownPresenceRef.current.activity,
            seatSlot: ownPresenceRef.current.seatSlot,
            avatarId: ownPresenceRef.current.avatarId,
            joinedAt: new Date().toISOString(),
          });

          if (trackResult !== "ok") {
            console.error(
              "Cannot track presence",
              trackResult,
            );
          }

          return;
        }

        if (
          status === "CHANNEL_ERROR" ||
          status === "TIMED_OUT" ||
          status === "CLOSED"
        ) {
          setConnectionStatus("disconnected");

          if (error) {
            console.error(
              "Realtime subscription error",
              error,
            );
          }
        }
      });

    channelRef.current = channel;

    return () => {
      channelRef.current = null;
      void supabase.removeChannel(channel);
    };
  }, [
    applyRealtimeEvent,
    initialRoom.id,
    user.displayName,
    user.id,
  ]);

  const updateActivity = useCallback(async (
    activity: Participant["activity"],
  ) => {
    const channel = channelRef.current;

    ownPresenceRef.current = { ...ownPresenceRef.current, activity };

    if (!channel) {
      return;
    }

    await channel.track({
      userId: user.id,
      displayName: user.displayName,
      activity,
      seatSlot: ownPresenceRef.current.seatSlot,
      avatarId: ownPresenceRef.current.avatarId,
      joinedAt: new Date().toISOString(),
    });
  }, [user.displayName, user.id]);

  /**
   * Updates this client's own seatSlot/avatarId in Presence — called after
   * POST /api/rooms/[roomId]/seat has already confirmed the claim server-side
   * (see docs/prd-chibi-avatar-seats.md §3.6). Presence itself is not the
   * source of truth for who "wins" a seat — it only broadcasts a result the
   * server has already decided, exactly like updateActivity does for
   * start_praying/finish_praying today.
   */
  const updateSeat = useCallback(async (
    seatSlot: number | null,
    avatarId: string | null,
  ) => {
    const channel = channelRef.current;

    ownPresenceRef.current = { ...ownPresenceRef.current, seatSlot, avatarId };

    if (!channel) {
      return;
    }

    await channel.track({
      userId: user.id,
      displayName: user.displayName,
      activity: ownPresenceRef.current.activity,
      seatSlot,
      avatarId,
      joinedAt: new Date().toISOString(),
    });
  }, [user.displayName, user.id]);

  const sendAction = useCallback(async (
    type: RoomActionType,
    payload: Record<string, unknown> = {},
    eventId = crypto.randomUUID(),
  ): Promise<RoomActionResponse> => {
    const response = await fetch(`/api/rooms/${initialRoom.id}/actions`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ eventId, type, payload }),
    });

    if (!response.ok) {
      const errorPayload = await showApiErrorToast(response, "Không thể thực hiện hành động.");
      throw new Error(errorPayload.error || `Action rejected with status ${response.status}`);
    }

    const payloadResponse = await response.json().catch(() => ({}));
    return { ...payloadResponse, eventId } as RoomActionResponse;
  }, [initialRoom.id]);

  const claimSeat = useCallback(async (seatSlot: number, avatarId?: string) => {
    const response = await fetch(`/api/rooms/${initialRoom.id}/seat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ seatSlot, avatarId }),
    });
    if (!response.ok) {
      const payload = await response.json().catch(() => ({})) as { error?: string };
      if (response.status === 409) throw new Error("Ghế này vừa được người khác chọn. Hãy chọn ghế khác.");
      throw new Error(payload.error === "NOT_A_ROOM_MEMBER" ? "Bạn cần vào phòng trước khi chọn ghế." : "Không thể cập nhật chỗ ngồi.");
    }
    await updateSeat(seatSlot, avatarId ?? null);
  }, [initialRoom.id, updateSeat]);

  const releaseSeat = useCallback(async () => {
    const response = await fetch(`/api/rooms/${initialRoom.id}/seat`, { method: "DELETE" });
    if (!response.ok) throw new Error("Không thể rời ghế hiện tại.");
    await updateSeat(null, null);
  }, [initialRoom.id, updateSeat]);

  return {
    room,
    participants,
    onlineCount: participants.length,
    connectionStatus,
    updateActivity,
    updateSeat,
    sendAction,
    claimSeat,
    releaseSeat,
  };
}
