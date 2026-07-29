"use client";

import { useEffect, useState } from 'react';
import { useAnonymousSignIn } from '@/features/auth/anonymous-captcha-gate';
import LiveAltarPage from '@/screens/LiveAltarPage';
import type { RoomSnapshot } from '@/features/temple-room/use-temple-room';

type WrapperProps = {
  initialRoom: RoomSnapshot;
};

export default function TempleRoomClientWrapper({ initialRoom }: WrapperProps) {
  const { signIn, captchaWidget } = useAnonymousSignIn();
  const [user, setUser] = useState<{ id: string; displayName: string } | null>(null);
  const [displayNameInput, setDisplayNameInput] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isJoining, setIsJoining] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    async function checkExistingAuth() {
      try {
        const u = await signIn();
        // check if user has a membership saved in localStorage or cookie for this room,
        // but to be safe we can just let them type their nickname or get their existing one.
        const savedName = localStorage.getItem(`temple_room_name_${initialRoom.id}`) || u.email?.split('@')[0] || '';
        if (savedName) {
          // Join automatically if nickname is already saved for this room
          setDisplayNameInput(savedName);
          await joinRoom(u.id, savedName);
        } else {
          setUser({ id: u.id, displayName: '' });
          setIsLoading(false);
        }
      } catch (err: any) {
        console.error(err);
        setError('Không thể xác thực. Vui lòng tải lại trang.');
        setIsLoading(false);
      }
    }

    void checkExistingAuth();
  }, [initialRoom.id, signIn]);

  const joinRoom = async (userId: string, name: string) => {
    setIsJoining(true);
    setError('');

    try {
      const res = await fetch(`/api/rooms/${initialRoom.id}/join`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ displayName: name })
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to join room');
      }

      // Save nickname for this room
      localStorage.setItem(`temple_room_name_${initialRoom.id}`, name);
      setUser({ id: userId, displayName: name });
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Có lỗi xảy ra khi tham gia đền.');
    } finally {
      setIsJoining(false);
      setIsLoading(false);
    }
  };

  const handleJoinSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!displayNameInput.trim() || !user) return;
    await joinRoom(user.id, displayNameInput.trim());
  };

  if (isLoading) {
    return (
      <div className="w-full min-h-screen bg-stone-950 flex flex-col justify-center items-center text-stone-300">
        {captchaWidget}
        <div className="w-10 h-10 border-4 border-amber-500 border-t-transparent rounded-full animate-spin mb-4" />
        <p className="text-xs uppercase tracking-wider font-bold">Đang tải phòng cầu nguyện...</p>
      </div>
    );
  }

  // If user has not input nickname, show nickname entry screen
  if (!user || !user.displayName) {
    return (
      <div className="w-full min-h-screen bg-[#1c1917] bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-amber-900/40 via-[#181615] to-black text-stone-100 flex flex-col justify-center items-center p-4">
        <div className="w-full max-w-md bg-stone-900/85 border-2 border-amber-500/20 rounded-3xl p-6 md:p-8 shadow-2xl backdrop-blur-md">
          <div className="text-center mb-6">
            <span className="inline-block px-3 py-1 rounded-full bg-amber-500/10 text-amber-400 font-bold text-xs uppercase tracking-wider mb-2 border border-amber-500/20">
              🔮 Đền Cầu Nguyện Tập Thể 🔮
            </span>
            <h1 className="text-xl md:text-2xl font-black font-serif text-amber-200 uppercase">
              {initialRoom.title}
            </h1>
            <p className="text-stone-400 text-xs md:text-sm mt-1">
              Vui lòng chọn biệt danh để bước vào ngôi đền
            </p>
          </div>

          {error && (
            <div className="p-3 mb-4 rounded-xl bg-red-950/80 border border-red-500 text-red-200 text-xs font-bold">
              {error}
            </div>
          )}

          <form onSubmit={handleJoinSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-amber-400 mb-1.5 uppercase tracking-wider">
                🕶️ Biệt danh dân chơi (Nickname)
              </label>
              <input
                type="text"
                required
                maxLength={30}
                placeholder="VD: Tung Fullstack, Coder Ẩn Danh..."
                value={displayNameInput}
                onChange={(e) => setDisplayNameInput(e.target.value)}
                className="w-full px-4 py-3 rounded-xl bg-stone-950 border border-stone-800 text-stone-100 placeholder-stone-600 focus:outline-none focus:border-amber-400 text-sm font-medium transition-colors"
              />
            </div>

            <button
              type="submit"
              disabled={isJoining || !displayNameInput.trim()}
              className="w-full py-3.5 rounded-xl bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 hover:from-amber-400 hover:to-orange-400 text-stone-950 font-black text-sm shadow-xl active:scale-95 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              <span>{isJoining ? 'Đang vào đền...' : 'BƯỚC VÀO ĐỀN'}</span>
            </button>
          </form>
        </div>
      </div>
    );
  }

  // Once user and displayName are resolved, render the live Altar
  return <LiveAltarPage initialRoom={initialRoom} user={user} />;
}
