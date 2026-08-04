"use client";

import { useCallback, useState } from "react";

import {
  type RoomSnapshot,
  useTempleRoom,
} from "./use-temple-room";

type TempleRoomClientProps = {
  initialRoom: RoomSnapshot;
  user: {
    id: string;
    displayName: string;
  };
};

type VisualEvent = {
  id: string;
  type: string;
  createdAt: number;
};

export function TempleRoomClient({
  initialRoom,
  user,
}: TempleRoomClientProps) {
  const [visualEvents, setVisualEvents] = useState<
    VisualEvent[]
  >([]);

  const handleRealtimeAction = useCallback(
    (event: {
      eventId: string;
      actionType: string;
    }) => {
      setVisualEvents((current) => [
        ...current.slice(-30),
        {
          id: event.eventId,
          type: event.actionType,
          createdAt: Date.now(),
        },
      ]);

      switch (event.actionType) {
        case "light_incense":
          // Chạy animation khói và hương.
          break;

        case "ring_bell":
          // Chạy rung chuông và phát âm thanh.
          break;

        case "reaction":
          // Hiển thị emoji bay lên.
          break;
      }
    },
    [],
  );

  const {
    room,
    participants,
    onlineCount,
    connectionStatus,
    updateActivity,
    sendAction,
  } = useTempleRoom({
    initialRoom,
    user,
    onRealtimeAction: handleRealtimeAction,
  });

  async function startPraying() {
    await updateActivity("praying");
    await sendAction("start_praying");
  }

  async function finishPraying() {
    await sendAction("finish_praying");
    await updateActivity("idle");
  }

  return (
    <main>
      <header>
        <h1>{room.title}</h1>

        <p>
          {onlineCount} người đang trong đền
        </p>

        <p>
          Kết nối: {connectionStatus}
        </p>
      </header>

      <section>
        <p>Hương: {room.incenseCount}</p>
        <p>Chuông: {room.bellCount}</p>
        <p>Lời khấn: {room.prayerCount}</p>
        <p>Linh lực: {room.energy}%</p>
      </section>

      <section>
        <button
          type="button"
          disabled={connectionStatus !== "connected"}
          onClick={() =>
            void sendAction("light_incense")
          }
        >
          Thắp hương
        </button>

        <button
          type="button"
          disabled={connectionStatus !== "connected"}
          onClick={() => void sendAction("ring_bell")}
        >
          Gõ chuông
        </button>

        <button
          type="button"
          onClick={() => void startPraying()}
        >
          Bắt đầu khấn
        </button>

        <button
          type="button"
          onClick={() => void finishPraying()}
        >
          Khấn xong
        </button>

        <button
          type="button"
          onClick={() =>
            void sendAction("reaction", {
              emoji: "🙏",
            })
          }
        >
          🙏
        </button>
      </section>

      <aside>
        <h2>Người tham gia</h2>

        {participants.map((participant) => (
          <div key={participant.userId}>
            <span>{participant.displayName}</span>

            {participant.activity === "praying" && (
              <span> đang khấn</span>
            )}
          </div>
        ))}
      </aside>

      <div hidden>
        {visualEvents.length} visual events
      </div>
    </main>
  );
}
