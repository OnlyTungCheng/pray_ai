import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import TempleRoomClientWrapper from './TempleRoomClientWrapper';

type Props = {
  params: Promise<{
    roomId: string;
  }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { roomId } = await params;
  const supabase = await createClient();

  const { data: room } = await supabase
    .from('rooms')
    .select('title')
    .eq('id', roomId)
    .maybeSingle();

  return {
    title: room ? `${room.title} | Đền Cầu Nguyện` : 'Đền Cầu Nguyện'
  };
}

export default async function TempleRoomPage({ params }: Props) {
  const { roomId } = await params;
  const supabase = await createClient();

  // Fetch initial room snapshot
  const { data: room, error } = await supabase
    .from('rooms')
    .select(
      `
        id,
        title,
        project_name,
        event_type,
        prayer,
        status,
        incense_count,
        bell_count,
        prayer_count,
        energy,
        revision
      `
    )
    .eq('id', roomId)
    .maybeSingle();

  if (error || !room) {
    notFound();
  }

  const initialRoom = {
    id: room.id,
    title: room.title,
    projectName: room.project_name,
    eventType: room.event_type as 'build' | 'deploy' | 'migration' | 'release',
    prayer: room.prayer,
    status: room.status,
    incenseCount: room.incense_count,
    bellCount: room.bell_count,
    prayerCount: room.prayer_count,
    energy: room.energy,
    revision: room.revision
  };

  return <TempleRoomClientWrapper initialRoom={initialRoom} />;
}
