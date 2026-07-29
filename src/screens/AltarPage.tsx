"use client";

import { useState, useEffect } from 'react';
import TechDeities, { DEITIES } from '../features/shrine/TechDeities';
import CenserSection from '../features/censer/CenserSection';
import PrayerModal from '../features/prayer/PrayerModal';
import BgmPlayer from '../components/BgmPlayer';
import SakuraRain from '../features/effects/SakuraRain';
import RemixFireworks from '../features/effects/RemixFireworks';
import DiscoBall from '../components/DiscoBall';
import { useLocalStorageState } from '../hooks/useLocalStorageState';
import { playBellSound } from '../utils/sound';
import type { IncenseStick, Wish } from '../types';

export default function AltarPage() {
  const [currentDeityId, setCurrentDeityId] = useState('claude');
  const [isPrayerModalOpen, setIsPrayerModalOpen] = useState(false);
  const [isSakuraActive, setIsSakuraActive] = useState(false);
  const [isFireworksActive, setIsFireworksActive] = useState(false);
  const [themeMode, setThemeMode] = useState('basic'); // 'basic' | 'remix'

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
          return prev + 1; // 100 increments * 30ms = 3000ms = 3s
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

  // Incense sticks state (persisted to localStorage)
  const [sticks, setSticks] = useLocalStorageState<IncenseStick[]>('dev_altar_sticks', () => [
    { x: 0.45, y: 0.98, z: 0.5, exp: Date.now() + 3600000, num: 1 },
    { x: 0.55, y: 0.97, z: 0.8, exp: Date.now() + 3600000, num: 1 }
  ]);

  // Dev wishes list (persisted to localStorage)
  const [_wishes, setWishes] = useLocalStorageState<Wish[]>('dev_altar_wishes', () => [
    {
      id: 1,
      author: 'Senior Fullstack Dev',
      text: 'Cầu cho lượt Deploy Production lúc 5h chiều nay 0 downtime, 0 bug, server ổn định!',
      targetDeity: 'Claude',
      blessings: 18,
      time: '10 mins ago'
    }
  ]);

  // Expiration timer for incense sticks
  useEffect(() => {
    const interval = setInterval(() => {
      setSticks((prev) => prev.filter((s) => !s.exp || s.exp > Date.now()));
    }, 10000);
    return () => clearInterval(interval);
  }, [setSticks]);

  const handleAddStick = (newStick: IncenseStick) => {
    setSticks((prev) => [...prev, newStick]);
  };

  const handleClearCenser = () => {
    setSticks([]);
  };

  const handleAddWish = (newWish: Wish) => {
    setWishes((prev) => [newWish, ...prev]);

    // Trigger theme-specific celebration effect after prayer!
    if (themeMode === 'remix') {
      setIsFireworksActive(true); // Explosive Celebratory Fireworks for Vinahouse Remix Theme!
    } else {
      setIsSakuraActive(true); // Falling Peach Blossom Petals for Basic Theme!
    }
  };

  const handleToggleTheme = () => {
    setThemeMode((prev) => (prev === 'basic' ? 'remix' : 'basic'));
  };

  const currentDeityObj = DEITIES.find((d) => d.id === currentDeityId) || DEITIES[0];
  const isRemix = themeMode === 'remix';

  return (
    <div
      className={`w-full min-h-screen overflow-y-auto flex flex-col justify-between font-sans selection:bg-amber-500 selection:text-stone-950 p-2 md:p-4 relative transition-colors duration-700 ${
        isRemix
          ? 'bg-[#1e0524] bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-fuchsia-800/70 via-[#2e0938] to-stone-950 text-fuchsia-100'
          : 'bg-[#2b231d] bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-amber-700/50 via-[#26201b] to-stone-950 text-stone-100'
      }`}
    >
      {/* Background Music Player with Theme Switcher */}
      <BgmPlayer
        themeMode={themeMode}
        onToggleTheme={handleToggleTheme}
      />

      {/* Interactive 3D Disco Ball for Vinahouse Remix Theme */}
      <DiscoBall isRemix={isRemix} />

      {/* Gentle Falling Peach Blossom Petals Animation for Basic Theme */}
      <SakuraRain
        isActive={isSakuraActive}
        onComplete={() => setIsSakuraActive(false)}
      />

      {/* Explosive Celebratory Nightclub Fireworks Burst for Remix Theme */}
      <RemixFireworks
        isActive={isFireworksActive}
        onComplete={() => setIsFireworksActive(false)}
      />

      {/* Centered Popup Prayer Modal */}
      <PrayerModal
        isOpen={isPrayerModalOpen}
        onClose={() => setIsPrayerModalOpen(false)}
        onAddWish={handleAddWish}
        currentDeityName={currentDeityObj.name}
        hasActiveIncense={sticks.length > 0}
        themeMode={themeMode}
      />

      {/* Clean Single Screen Altar Content (No Scroll, Ultra Clean View) */}
      <main className="flex-1 flex flex-col justify-center items-center relative overflow-hidden">
        {/* 1. Tượng Thần Dev (Claude, Codex, Kiro) trong Miếu Thờ / Club */}
        <TechDeities themeMode={themeMode} activeDeityId={currentDeityId} onSelectDeity={setCurrentDeityId} />

        {/* 2. Bát Hương / Bàn DJ + Nút Dọn Bát Hương & Nút Khấn Nguyện */}
        <CenserSection
          sticks={sticks}
          onAddStick={handleAddStick}
          onClearCenser={handleClearCenser}
          onOpenPrayerModal={() => setIsPrayerModalOpen(true)}
          themeMode={themeMode}
        />
      </main>

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
