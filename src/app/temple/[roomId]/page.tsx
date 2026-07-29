import type { Metadata } from 'next';
import { cache } from 'react';
import { notFound } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { getRoomById } from '@/features/temple-room/room-service';
import TempleRoomClientWrapper from './TempleRoomClientWrapper';

type Props = {
  params: Promise<{
    roomId: string;
  }>;
};

const EVENT_LABELS: Record<string, string> = {
  build: 'Build',
  deploy: 'Deploy',
  migration: 'Migration',
  release: 'Release'
};

/**
 * Wrapped in React's `cache()` so generateMetadata and the page component
 * below — both of which need the exact same room row for the exact same
 * request — share a single DB round-trip instead of two. `cache()` dedupes
 * by arguments within one render pass (server-only, per-request; it is NOT
 * a persistent/cross-request cache), which is exactly the lifetime we want
 * here: metadata and the page component are evaluated for the same
 * navigation, never across different requests.
 */
const getRoomForRequest = cache(async (roomId: string) => {
  const supabase = await createClient();
  return getRoomById(supabase, roomId);
});

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { roomId } = await params;
  const room = await getRoomForRequest(roomId);

  const title = room
    ? `${room.projectName} | Đền Cầu Nguyện`
    : 'Đền Cầu Nguyện';
  const description = room
    ? `⛩️ ${room.title} — ${EVENT_LABELS[room.eventType] ?? room.eventType}. ${room.prayer}`
    : 'Lập đền thắp nhang, gõ chuông cầu nguyện trước giờ deploy.';

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: 'website',
      images: [
        {
          url: '/temple-og-preview-v1.png',
          width: 1200,
          height: 630,
          alt: 'Đền Cầu Nguyện — Cyber Temple'
        }
      ]
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: ['/temple-og-preview-v1.png']
    }
  };
}

export default async function TempleRoomPage({ params }: Props) {
  const { roomId } = await params;
  const room = await getRoomForRequest(roomId);

  if (!room) {
    notFound();
  }

  // room is already a fully-mapped RoomSummary (via getRoomById ->
  // ROOM_SUMMARY_COLUMNS/mapRoomRow, the same shared mapper every other
  // room read in this app uses) — no hand-rolled select/mapping here, so
  // this can never drift out of sync with RoomSummary's fields again the
  // way the previous version had (it was missing offeringCount, hallId,
  // primaryDeityId, supportDeityIds entirely).
  const initialRoom = room;

  return <TempleRoomClientWrapper initialRoom={initialRoom} />;
}
