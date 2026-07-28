import { useState, useEffect } from 'react';
import TechDeities, { DEITIES } from '../features/shrine/TechDeities';
import CenserSection from '../features/censer/CenserSection';
import PrayerModal from '../features/prayer/PrayerModal';
import BgmPlayer from '../components/BgmPlayer';
import SakuraRain from '../features/effects/SakuraRain';
import DiscoBall from '../components/DiscoBall';
import { useLocalStorageState } from '../hooks/useLocalStorageState';
import type { IncenseStick, Wish } from '../types';

export default function AltarPage() {
  const [currentDeityId] = useState('claude');
  const [isPrayerModalOpen, setIsPrayerModalOpen] = useState(false);
  const [isSakuraActive, setIsSakuraActive] = useState(false);
  const [themeMode, setThemeMode] = useState('basic'); // 'basic' | 'remix'

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
      targetDeity: 'Claude Code',
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
    setIsSakuraActive(true); // Trigger falling peach blossom petals!
  };

  const handleToggleTheme = () => {
    setThemeMode((prev) => (prev === 'basic' ? 'remix' : 'basic'));
  };

  const currentDeityObj = DEITIES.find((d) => d.id === currentDeityId) || DEITIES[0];
  const isRemix = themeMode === 'remix';

  return (
    <div
      className={`w-full h-screen overflow-hidden flex flex-col justify-between font-sans selection:bg-amber-500 selection:text-stone-950 p-2 md:p-4 relative transition-colors duration-700 ${
        isRemix
          ? 'bg-[#15021a] bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-fuchsia-900/60 via-[#1f002b] to-stone-950 text-fuchsia-100'
          : 'bg-[#241e1a] bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-amber-900/30 via-[#1c1815] to-stone-950 text-stone-200'
      }`}
    >
      {/* Background Music Player with Theme Switcher */}
      <BgmPlayer
        themeMode={themeMode}
        onToggleTheme={handleToggleTheme}
      />

      {/* Interactive 3D Disco Ball for Vinahouse Remix Theme */}
      <DiscoBall isRemix={isRemix} />

      {/* Gentle Falling Peach Blossom Petals Animation (Hoa Đào Rơi) */}
      <SakuraRain
        isActive={isSakuraActive}
        onComplete={() => setIsSakuraActive(false)}
      />

      {/* Centered Popup Prayer Modal */}
      <PrayerModal
        isOpen={isPrayerModalOpen}
        onClose={() => setIsPrayerModalOpen(false)}
        onAddWish={handleAddWish}
        currentDeityName={currentDeityObj.name}
        hasActiveIncense={sticks.length > 0}
      />

      {/* Clean Single Screen Altar Content (No Scroll, Ultra Clean View) */}
      <main className="flex-1 flex flex-col justify-center items-center relative overflow-hidden">
        {/* 1. Tượng Thần Dev (Claude Code, Codex, Kiro) trong Miếu Thờ */}
        <TechDeities themeMode={themeMode} />

        {/* 2. Bát Hương / Bán Pháo Bông + Nút Dọn Bát Hương & Nút Khấn Nguyện */}
        <CenserSection
          sticks={sticks}
          onAddStick={handleAddStick}
          onClearCenser={handleClearCenser}
          onOpenPrayerModal={() => setIsPrayerModalOpen(true)}
          themeMode={themeMode}
        />
      </main>
    </div>
  );
}
