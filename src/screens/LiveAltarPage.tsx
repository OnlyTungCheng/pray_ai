"use client";

import { useState, useEffect, useCallback } from 'react';
import { playBellSound } from '../utils/sound';
import { useTempleRoom, type RoomSnapshot } from '../features/temple-room/use-temple-room';
import TechDeities, { DEITIES } from '../features/shrine/TechDeities';
import CenserSection from '../features/censer/CenserSection';
import PrayerModal from '../features/prayer/PrayerModal';
import BgmPlayer from '../components/BgmPlayer';
import SakuraRain from '../features/effects/SakuraRain';
import RemixFireworks from '../features/effects/RemixFireworks';
import DiscoBall from '../components/DiscoBall';
import { useRouter } from 'next/navigation';
import type { IncenseStick, Wish } from '../types';
import { createClient } from '../lib/supabase/client';

type LiveAltarPageProps = {
  initialRoom: RoomSnapshot;
  user: {
    id: string;
    displayName: string;
  };
};

export default function LiveAltarPage({ initialRoom, user }: LiveAltarPageProps) {
  const router = useRouter();
  const [currentDeityId, setCurrentDeityId] = useState('claude');
  const [isPrayerModalOpen, setIsPrayerModalOpen] = useState(false);
  const [isSakuraActive, setIsSakuraActive] = useState(false);
  const [isFireworksActive, setIsFireworksActive] = useState(false);
  const [themeMode, setThemeMode] = useState(initialRoom.status === 'completed' ? 'remix' : 'basic');

  // Local visual sticks, added dynamically when receiving realtime broadcast
  const [visualSticks, setVisualSticks] = useState<IncenseStick[]>([]);
  
  // Local list of wishes, updated via DB query and real-time events
  const [wishes, setWishes] = useState<Wish[]>([]);

  // Press F to Pray states
  const [prayProgress, setPrayProgress] = useState(0);
  const [isHoldingF, setIsHoldingF] = useState(false);

  // Press F to Pray Logic
  useEffect(() => {
    let interval: any;

    if (isHoldingF) {
      interval = setInterval(() => {
        setPrayProgress((prev) => {
          if (prev >= 100) {
            clearInterval(interval);
            return 100;
          }
          return prev + 1; // 100 * 30ms = 3s
        });
      }, 30);
    } else {
      setPrayProgress(0);
    }

    return () => clearInterval(interval);
  }, [isHoldingF]);

  useEffect(() => {
    if (prayProgress === 100) {
      playBellSound();
      setIsHoldingF(false);

      // Trigger start_praying live actions & presence activity update!
      void sendAction('start_praying');
      void updateActivity('praying');
      
      // Auto open prayer modal
      setIsPrayerModalOpen(true);
    }
  }, [prayProgress]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.repeat) return;
      const tag = document.activeElement?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA') return;

      if (e.key === 'f' || e.key === 'F') {
        setIsHoldingF(true);
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.key === 'f' || e.key === 'F') {
        setIsHoldingF(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, []);

  const handleRealtimeAction = useCallback((event: any) => {
    const { actionType, actionPayload, actorId } = event;

    if (actionType === 'light_incense') {
      const newStick: IncenseStick = {
        x: actionPayload.x || 0.5,
        y: actionPayload.y || 0.98,
        z: actionPayload.z || 0.5,
        exp: Date.now() + 3600000,
        num: 1
      };
      setVisualSticks((prev) => [...prev, newStick]);
    } else if (actionType === 'finish_praying') {
      // Add the new wish to local state wall
      const newWish: Wish = {
        id: Date.now(),
        author: actionPayload.author || 'Dân Chơi Dev',
        text: actionPayload.text || '',
        targetDeity: actionPayload.targetDeity || 'Tam Vị Thần',
        blessings: 1,
        time: 'Vừa xong'
      };
      setWishes((prev) => [newWish, ...prev]);

      // Trigger effects
      if (themeMode === 'remix') {
        setIsFireworksActive(true);
      } else {
        setIsSakuraActive(true);
      }

      // If this was finished by the current user, draw the oracle server-side
      // (so the result can't be forged via query params) and redirect using
      // only the real, persisted resultId.
      if (actorId === user.id) {
        void (async () => {
          try {
            const response = await fetch('/api/oracle', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                eventType: 'deploy',
                roomId: initialRoom.id
              })
            });

            if (!response.ok) {
              throw new Error('Failed to draw oracle');
            }

            const { result } = await response.json();
            router.push(`/oracle/${result.id}`);
          } catch (err) {
            console.error(err);
          }
        })();
      }
    }
  }, [themeMode, user.id, router, initialRoom.title]);

  const {
    room,
    participants,
    onlineCount,
    connectionStatus,
    updateActivity
  } = useTempleRoom({
    initialRoom,
    user,
    onRealtimeAction: handleRealtimeAction
  });

  const supabase = createClient();

  // Load existing wishes and sticks on mount
  useEffect(() => {
    async function loadInitialData() {
      // 1. Fetch recent finish_praying actions to build the Wish Wall
      const { data: actions, error } = await supabase
        .from('room_actions')
        .select('*')
        .eq('room_id', initialRoom.id)
        .eq('action_type', 'finish_praying')
        .order('created_at', { ascending: false })
        .limit(10);

      if (actions && !error) {
        const loadedWishes: Wish[] = actions.map((a: any) => ({
          id: a.id,
          author: a.payload.author || 'Developer',
          text: a.payload.text || '',
          targetDeity: a.payload.targetDeity || 'Tam Vị Thần',
          blessings: a.payload.blessings || 1,
          time: new Date(a.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }));
        setWishes(loadedWishes);
      }

      // 2. Fetch existing light_incense actions to display current sticks
      const { data: incenseActions } = await supabase
        .from('room_actions')
        .select('*')
        .eq('room_id', initialRoom.id)
        .eq('action_type', 'light_incense')
        .order('created_at', { ascending: false })
        .limit(15);

      if (incenseActions) {
        const loadedSticks: IncenseStick[] = incenseActions.map((a: any) => ({
          x: a.payload.x || 0.5,
          y: a.payload.y || 0.98,
          z: a.payload.z || 0.5,
          exp: new Date(a.created_at).getTime() + 3600000,
          num: 1
        })).filter((s: IncenseStick) => s.exp! > Date.now());
        setVisualSticks(loadedSticks);
      }
    }

    void loadInitialData();
  }, [initialRoom.id]);

  // Clean up expired sticks local visual state
  useEffect(() => {
    const interval = setInterval(() => {
      setVisualSticks((prev) => prev.filter((s) => !s.exp || s.exp > Date.now()));
    }, 10000);
    return () => clearInterval(interval);
  }, []);

  async function sendAction(
    type: 'light_incense' | 'ring_bell' | 'start_praying' | 'finish_praying' | 'reaction',
    payload: Record<string, unknown> = {}
  ) {
    const eventId = crypto.randomUUID();
    const response = await fetch(`/api/rooms/${room.id}/actions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        eventId,
        type,
        payload
      })
    });

    if (!response.ok) {
      const errData = await response.json().catch(() => ({}));
      throw new Error(errData.error || `Action was rejected with status ${response.status}`);
    }
  }

  const handleAddStick = (newStick: IncenseStick) => {
    // Send action to DB/Realtime
    void sendAction('light_incense', {
      x: newStick.x,
      y: newStick.y,
      z: newStick.z
    });
  };

  const handleClearCenser = async () => {
    // Local clear for UI, in real app could delete or let it expire
    setVisualSticks([]);
  };

  const handleAddWish = async (newWish: Wish) => {
    await updateActivity('idle');
    await sendAction('finish_praying', {
      author: newWish.author,
      text: newWish.text,
      targetDeity: newWish.targetDeity,
      blessings: 1
    });
  };

  const handleToggleTheme = () => {
    setThemeMode((prev) => (prev === 'basic' ? 'remix' : 'basic'));
  };

  const currentDeityObj = DEITIES.find((d) => d.id === currentDeityId) || DEITIES[0];
  const isRemix = themeMode === 'remix';

  return (
    <div
      className={`w-full min-h-screen overflow-y-auto flex flex-col justify-between font-sans selection:bg-amber-500 selection:text-stone-950 p-2 md:p-4 relative transition-colors duration-700 pb-16 ${
        isRemix
          ? 'bg-[#1e0524] bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-fuchsia-800/70 via-[#2e0938] to-stone-950 text-fuchsia-100'
          : 'bg-[#2b231d] bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-amber-700/50 via-[#26201b] to-stone-950 text-stone-100'
      }`}
    >
      {/* Background Music Player instance (rendered inline in the footer) */}

      {/* Interactive 3D Disco Ball for Vinahouse Remix Theme */}
      <DiscoBall isRemix={isRemix} />

      {/* Gentle Falling Peach Blossom Petals Animation for Basic Theme */}
      <SakuraRain isActive={isSakuraActive} onComplete={() => setIsSakuraActive(false)} />

      {/* Explosive Celebratory Nightclub Fireworks Burst for Remix Theme */}
      <RemixFireworks isActive={isFireworksActive} onComplete={() => setIsFireworksActive(false)} />

      {/* Centered Popup Prayer Modal */}
      <PrayerModal
        isOpen={isPrayerModalOpen}
        onClose={() => setIsPrayerModalOpen(false)}
        onAddWish={handleAddWish}
        currentDeityName={currentDeityObj.name}
        hasActiveIncense={visualSticks.length > 0}
        themeMode={themeMode}
      />

      <header className="z-30 max-w-4xl mx-auto w-full text-center mt-8">
        <h1 className="text-3xl md:text-5xl font-black font-serif text-amber-200 tracking-wider">
          {room.title}
        </h1>
        <p className="text-stone-400 text-xs md:text-sm mt-1 uppercase tracking-widest font-bold">
          ⚡ Linh lực deploy: {room.energy}% • {connectionStatus === 'connected' ? '🟢' : connectionStatus === 'connecting' ? '🟡' : '🔴'} {onlineCount} online ({connectionStatus})
        </p>
      </header>

      {/* Clean Single Screen Altar Content (No Scroll, Ultra Clean View) */}
      <main className="flex-1 flex flex-col justify-center items-center relative overflow-hidden my-4 z-20">
        {/* 1. Tượng Thần Dev trong Miếu Thờ */}
        <TechDeities themeMode={themeMode} activeDeityId={currentDeityId} onSelectDeity={setCurrentDeityId} />

        {/* 2. Bát Hương / Bàn DJ + Nút Dọn Bát Hương & Nút Khấn Nguyện */}
        <CenserSection
          sticks={visualSticks}
          onAddStick={handleAddStick}
          onClearCenser={handleClearCenser}
          onOpenPrayerModal={() => {
            void sendAction('start_praying');
            void updateActivity('praying');
            setIsPrayerModalOpen(true);
          }}
          themeMode={themeMode}
        />
      </main>

      {/* Live Wish Wall Section */}
      <section className="z-30 max-w-4xl mx-auto w-full px-4 mt-8 pb-12">
        <h3 className="text-xl font-bold text-amber-200 mb-4 flex items-center gap-2 font-serif justify-center border-b border-stone-800 pb-2">
          <span>📜</span> Sớ Cầu Nguyện Gần Đây ({wishes.length})
        </h3>
        {wishes.length === 0 ? (
          <p className="text-stone-500 text-sm text-center italic">Hãy thắp hương và dâng lời khấn đầu tiên...</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {wishes.map((w, idx) => (
              <div
                key={idx}
                className="p-4 rounded-xl bg-stone-900/90 border border-stone-800 hover:border-amber-500/30 transition-all shadow-md flex flex-col justify-between"
              >
                <div>
                  <div className="flex justify-between items-center text-xs text-amber-400 font-bold mb-2">
                    <span>👨‍💻 {w.author}</span>
                    <span className="text-stone-500 font-medium">{w.time}</span>
                  </div>
                  <p className="text-sm text-stone-200 italic font-serif">"{w.text}"</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Online Users Presence Footer Panel */}
      <footer className="fixed bottom-0 left-0 right-0 bg-stone-950/85 backdrop-blur-md border-t border-stone-800/80 px-4 py-2.5 z-40 flex items-center justify-between text-xs font-bold text-stone-400">
        <div className="flex items-center gap-2 overflow-x-auto whitespace-nowrap scrollbar-none pr-4 max-w-[80%]">
          <span>🟢 Đang ở đền:</span>
          {participants.map((p, idx) => (
            <span
              key={idx}
              className={`px-2 py-0.5 rounded-full text-[10px] ${
                p.activity === 'praying'
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 animate-pulse'
                  : 'bg-stone-800 text-stone-300'
              }`}
            >
              {p.displayName} {p.activity === 'praying' && '🙏'}
            </span>
          ))}
        </div>
        <div className="flex items-center gap-3 shrink-0">
          <BgmPlayer themeMode={themeMode} onToggleTheme={handleToggleTheme} isInline={true} />
          <button
            onClick={() => {
              const getEventTypeLabel = (type: string) => {
                switch (type) {
                  case 'build': return 'Lễ Build Hệ Thống 🛠️';
                  case 'deploy': return 'Lễ Deploy Production 🚀';
                  case 'migration': return 'Lễ Migration Database 💾';
                  case 'release': return 'Lễ Release Phiên Bản Mới 📦';
                  default: return 'Lễ Cầu Nguyện 🙏';
                }
              };
              const shareText = `⛩️ Đền Cầu Nguyện AI: Dự án [${room.projectName}] đang làm ${getEventTypeLabel(room.eventType)}!\n\n📝 Lời khấn: "${room.prayer}"\n🔥 Đang thắp: ${visualSticks.length} nén hương\n🟢 Trạng thái: ${onlineCount} đồng đội đang online\n⚡ Linh lực deploy: ${room.energy}%\n\nAnh em vào tiếp thêm linh lực và cùng khấn độ trì cho dự án này nhé! 🙏✨\n🔗 Tham gia ngay tại: ${window.location.href}`;
              navigator.clipboard.writeText(shareText);
              alert('Đã copy thông điệp chia sẻ động kèm link đền! Hãy gửi vào Slack/Discord để rủ đồng nghiệp cùng khấn nguyện.');
            }}
            className="px-3 py-1 bg-amber-500 hover:bg-amber-400 text-stone-950 rounded-lg text-[10px] uppercase font-black tracking-wider shadow active:scale-95 transition-all cursor-pointer shrink-0"
          >
            🔗 Chia sẻ phòng
          </button>
        </div>
      </footer>
      {/* Press F to Pray Helper / Button for Mobile */}
      <div className="absolute bottom-24 left-1/2 -translate-x-1/2 z-35 flex flex-col items-center gap-2 pointer-events-auto select-none">
        {!isHoldingF && (
          <div className="hidden md:block bg-stone-900/90 border border-amber-500/30 px-5 py-2.5 rounded-full text-xs text-amber-300 font-bold animate-pulse shadow-[0_4px_20px_rgba(0,0,0,0.5)]">
            ⌨️ Nhấn giữ phím <span className="bg-amber-500 text-stone-950 px-2 py-0.5 rounded font-black mx-1">F</span> để khấn nguyện
          </div>
        )}
        <button
          onMouseDown={() => setIsHoldingF(true)}
          onMouseUp={() => setIsHoldingF(false)}
          onTouchStart={(e) => { e.preventDefault(); setIsHoldingF(true); }}
          onTouchEnd={(e) => { e.preventDefault(); setIsHoldingF(false); }}
          className="md:hidden w-16 h-16 rounded-full bg-gradient-to-r from-amber-500 to-orange-600 active:from-amber-400 active:to-orange-500 text-stone-950 flex items-center justify-center shadow-lg font-black text-2xl select-none active:scale-95 transition-all border border-amber-300/40"
          title="Chạm giữ để khấn nguyện"
        >
          🙏
        </button>
      </div>

      {/* Eyelids closing effect overlay */}
      {prayProgress > 0 && (
        <div className="fixed inset-0 z-50 pointer-events-none flex flex-col justify-between">
          <div
            className="w-full h-[50vh] bg-black/95 transition-transform duration-100 ease-out origin-top"
            style={{ transform: `translateY(${-100 + prayProgress}%)` }}
          />
          <div
            className="w-full h-[50vh] bg-black/95 transition-transform duration-100 ease-out origin-bottom"
            style={{ transform: `translateY(${100 - prayProgress}%)` }}
          />
          {isHoldingF && (
            <div className="absolute inset-0 flex flex-col items-center justify-center text-amber-200 text-lg font-black font-serif uppercase tracking-widest animate-pulse px-4 text-center">
              <span>Đang nhắm mắt khấn nguyện...</span>
              <span className="text-sm text-stone-500 font-sans mt-2">({Math.round(prayProgress)}%)</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
