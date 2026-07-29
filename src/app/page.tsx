import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { getSystemLobbyRoom } from '@/features/temple-room/room-service';
import { listActiveProjectRooms, getProjectTopRank } from '@/features/temple-room/room-directory';
import TempleRoomClientWrapper from './temple/[roomId]/TempleRoomClientWrapper';

const EVENT_TYPE_LABELS: Record<string, string> = {
  build: '📦 Build',
  deploy: '🚀 Deploy',
  migration: '💾 Migration',
  release: '🎉 Release'
};

export default async function HomePage() {
  const supabase = await createClient();

  const [lobbyRoom, activeRooms, topRank] = await Promise.all([
    getSystemLobbyRoom(supabase),
    listActiveProjectRooms(supabase),
    getProjectTopRank(supabase)
  ]);

  // Migrations 0004/0005 haven't been applied to this Supabase project yet —
  // degrade gracefully instead of crashing the homepage.
  if (!lobbyRoom) {
    return (
      <div className="w-full min-h-screen bg-stone-950 text-stone-300 flex flex-col items-center justify-center p-8 text-center gap-4">
        <p className="text-amber-400 font-bold">⚠️ Sảnh chung chưa được khởi tạo.</p>
        <p className="text-sm text-stone-500 max-w-md">
          Cần chạy migration <code className="text-amber-300">0004_seed_system_lobby_room.sql</code> trên Supabase
          project trước khi trang chủ hoạt động đầy đủ.
        </p>
        <Link href="/pray" className="px-6 py-2.5 rounded-xl bg-amber-500 text-stone-950 font-bold text-sm">
          Tạo phòng cầu nguyện riêng →
        </Link>
      </div>
    );
  }

  return (
    <div className="w-full min-h-screen bg-[#1c1917] text-stone-100">
      {/* Shared communal lobby — thắp nhang/gõ chuông chung tại sảnh chính (PRD 3.2) */}
      <TempleRoomClientWrapper initialRoom={lobbyRoom} />

      <section className="max-w-5xl mx-auto w-full px-4 py-12 grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Danh sách phòng dự án đang hoạt động */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-black font-serif text-amber-200">🏛️ Đền dự án đang hoạt động</h2>
            <Link href="/pray" className="text-xs font-bold text-amber-400 hover:text-amber-300">
              + Lập đền mới
            </Link>
          </div>

          {activeRooms.length === 0 ? (
            <p className="text-stone-500 text-sm italic">Chưa có đền dự án nào đang hoạt động.</p>
          ) : (
            <ul className="space-y-2">
              {activeRooms.map((room) => (
                <li key={room.id}>
                  <Link
                    href={`/temple/${room.id}`}
                    className="block p-4 rounded-xl bg-stone-900/80 border border-stone-800 hover:border-amber-500/40 transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-stone-100 text-sm">{room.projectName}</span>
                      <span className="text-xs text-stone-400">{EVENT_TYPE_LABELS[room.eventType] ?? room.eventType}</span>
                    </div>
                    <div className="text-xs text-stone-500 mt-1">
                      🔥 {room.incenseCount} · 🔔 {room.bellCount} · ⚡ {room.energy}%
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Top Rank dự án */}
        <div>
          <h2 className="text-lg font-black font-serif text-amber-200 mb-4">🏆 Top Rank dự án</h2>

          {topRank.length === 0 ? (
            <p className="text-stone-500 text-sm italic">Chưa có dự án nào để xếp hạng.</p>
          ) : (
            <ol className="space-y-2">
              {topRank.map((entry, index) => (
                <li
                  key={entry.projectName}
                  className="flex items-center justify-between p-4 rounded-xl bg-stone-900/80 border border-stone-800"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-amber-400 font-black text-sm w-6">#{index + 1}</span>
                    <span className="font-bold text-stone-100 text-sm">{entry.projectName}</span>
                  </div>
                  <span className="text-xs text-stone-400">
                    🔥 {entry.totalIncense} · 🔔 {entry.totalBell} · ⚡ {entry.avgEnergy}%
                  </span>
                </li>
              ))}
            </ol>
          )}
        </div>
      </section>
    </div>
  );
}
