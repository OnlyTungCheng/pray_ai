import { useState, useEffect } from 'react';
import { Routes, Route } from 'react-router';
import TechDeities, { DEITIES } from './components/TechDeities';
import CenserSection from './components/CenserSection';
import PrayerModal from './components/PrayerModal';
import BgmPlayer from './components/BgmPlayer';
import SakuraRain from './components/SakuraRain';
import type { IncenseStick, Wish } from './types';

function AltarPage() {
  const [currentDeityId] = useState('claude');
  const [isPrayerModalOpen, setIsPrayerModalOpen] = useState(false);
  const [isSakuraActive, setIsSakuraActive] = useState(false);

  // Incense sticks state
  const [sticks, setSticks] = useState<IncenseStick[]>(() => {
    try {
      const saved = localStorage.getItem('dev_altar_sticks');
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    return [
      { x: 0.45, y: 0.98, z: 0.5, exp: Date.now() + 3600000, num: 1 },
      { x: 0.55, y: 0.97, z: 0.8, exp: Date.now() + 3600000, num: 1 }
    ];
  });

  // Dev wishes list
  const [wishes, setWishes] = useState<Wish[]>(() => {
    try {
      const saved = localStorage.getItem('dev_altar_wishes');
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    return [
      {
        id: 1,
        author: 'Senior Fullstack Dev',
        text: 'Cầu cho lượt Deploy Production lúc 5h chiều nay 0 downtime, 0 bug, server ổn định!',
        targetDeity: 'Claude Code',
        blessings: 18,
        time: '10 mins ago'
      }
    ];
  });

  // Expiration timer for incense sticks
  useEffect(() => {
    const interval = setInterval(() => {
      setSticks((prev) => prev.filter((s) => !s.exp || s.exp > Date.now()));
    }, 10000);
    return () => clearInterval(interval);
  }, []);

  // Save state to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('dev_altar_sticks', JSON.stringify(sticks));
      localStorage.setItem('dev_altar_wishes', JSON.stringify(wishes));
    } catch (e) {}
  }, [sticks, wishes]);

  const handleAddStick = (newStick: IncenseStick) => {
    setSticks((prev) => [...prev, newStick]);
  };

  const handleClearCenser = () => {
    setSticks([]);
  };

  const handleAddWish = (newWish: Wish) => {
    setWishes((prev) => [newWish, ...prev]);
    setIsSakuraActive(true); // Trigger falling peach blossom petals gently!
  };

  const currentDeityObj = DEITIES.find((d) => d.id === currentDeityId) || DEITIES[0];

  return (
    <div className="w-full h-screen overflow-hidden flex flex-col justify-between font-sans selection:bg-amber-500 selection:text-stone-950 bg-[#241e1a] bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-amber-900/30 via-[#1c1815] to-stone-950 text-stone-200 p-2 md:p-4 relative">
      {/* Background Music Player */}
      <BgmPlayer />

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
        {/* 1. Tượng Thần Dev (Claude Code, Codex, Kiro) */}
        <TechDeities />

        {/* 2. Bát Hương & Khói Nhang + Nút Dọn Bát Hương & Nút Khấn Nguyện */}
        <CenserSection
          sticks={sticks}
          onAddStick={handleAddStick}
          onClearCenser={handleClearCenser}
          onOpenPrayerModal={() => setIsPrayerModalOpen(true)}
        />
      </main>
    </div>
  );
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<AltarPage />} />
    </Routes>
  );
}
