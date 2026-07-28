import React, { useState, useEffect } from 'react';

const devOfferings = {
  coffee: { icon: '☕', name: 'Cà Phê Tỉnh Táo' },
  code: { icon: '💻', name: 'Clean Code' },
  energy: { icon: '⚡', name: 'Tăng Lực' },
  pizza: { icon: '🍕', name: 'Pizza Tăng Ca' },
  cash: { icon: '💵', name: 'Bonus Lì Xì' },
  pray: { icon: '🙏', name: 'Cầu Nguyện' }
};

function FullscreenIcon({ className }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      fill="none"
      viewBox="0 0 24 24"
      strokeWidth={1.5}
      stroke="currentColor"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M3.75 3.75v4.5m0-4.5h4.5m-4.5 0L9 9M3.75 20.25v-4.5m0 4.5h4.5m-4.5 0L9 15M20.25 3.75h-4.5m4.5 0v4.5m0-4.5L15 9m5.25 11.25h-4.5m4.5 0v-4.5m0 4.5L15 15"
      />
    </svg>
  );
}

export default function Toolbar({ emojiCounts, onAddEmoji, onNextDeity, onOpenPrayerModal }) {
  const [activeFloatingEmoji, setActiveFloatingEmoji] = useState(null);
  const [isFullscreen, setIsFullscreen] = useState(false);

  useEffect(() => {
    const handleFSChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFSChange);
    return () => document.removeEventListener('fullscreenchange', handleFSChange);
  }, []);

  const handleFullscreenToggle = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen?.().catch(() => {});
    } else {
      document.exitFullscreen?.().catch(() => {});
    }
  };

  const handleOpenPrayer = () => {
    onOpenPrayerModal?.();
    document.getElementById('prayer-input-section')?.scrollIntoView({ behavior: 'smooth' });
  };

  const formatCount = (count) => {
    if (!count) return 0;
    return count > 99999 ? `${Math.floor(count / 1000)}K` : count;
  };

  return (
    <div className="relative flex justify-center flex-wrap gap-2 md:gap-x-4 mx-auto w-full max-w-4xl px-4 z-20 select-none translate-y-[-2vh]">
      {/* Dev Offerings Buttons */}
      {Object.entries(devOfferings).map(([key, item]) => (
        <button
          key={key}
          className="active:scale-125 duration-300 active:duration-75 transition-transform text-xs md:text-sm text-amber-200 tracking-wider font-semibold group cursor-pointer"
          onClick={() => {
            setActiveFloatingEmoji(item.icon);
            onAddEmoji(key);
          }}
          title={`Dâng ${item.name}`}
        >
          <div className="relative flex flex-col justify-center items-center mb-1 w-12 h-12 md:w-14 md:h-14 rounded-2xl bg-stone-900/80 border border-amber-500/30 hover:border-amber-400 hover:bg-amber-950/40 shadow-lg backdrop-blur-md">
            <span className="text-2xl md:text-3xl group-hover:scale-125 transition-transform duration-200">
              {item.icon}
            </span>
          </div>
          <span className="block font-mono text-amber-400">{formatCount(emojiCounts[key])}</span>
        </button>
      ))}

      <div className="hidden sm:block w-4" />

      {/* Write Prayer Button */}
      <button
        className="active:scale-125 transition-all self-center p-2 rounded-2xl bg-gradient-to-r from-amber-500 to-orange-500 text-stone-950 hover:from-amber-400 hover:to-orange-400 cursor-pointer flex flex-col items-center justify-center w-12 h-12 md:w-14 md:h-14 shadow-lg shadow-amber-500/30 font-bold"
        onClick={handleOpenPrayer}
        title="Bấm để mở Khung Nhập Lời Cầu Nguyện"
      >
        <span className="text-xl">✍️</span>
        <span className="text-[10px] font-black uppercase">Viết Lời</span>
      </button>

      {/* Switch Tech Deity Button */}
      <button
        className="active:scale-125 active:opacity-50 transition-all self-center p-2 rounded-2xl bg-stone-900/80 border border-amber-500/40 text-amber-300 hover:bg-amber-900/40 cursor-pointer flex flex-col items-center justify-center w-12 h-12 md:w-14 md:h-14 shadow-lg"
        onClick={onNextDeity}
        title="Chuyển Vị Thần Dev (Switch God)"
      >
        <span className="text-xl">⛩️</span>
        <span className="text-[10px] font-semibold text-amber-400">Đổi Vị</span>
      </button>

      {/* Fullscreen Button */}
      <button
        className="active:scale-125 active:opacity-50 transition-all self-center p-2 rounded-2xl bg-stone-900/80 border border-amber-500/30 text-amber-300 hover:bg-stone-800 cursor-pointer flex items-center justify-center w-12 h-12 md:w-14 md:h-14 shadow-lg"
        onClick={handleFullscreenToggle}
        title={isFullscreen ? 'Thoát Toàn Màn Hình' : 'Toàn Màn Hình'}
      >
        <FullscreenIcon className="w-6 h-6" />
      </button>

      {/* Floating Animated Offering Overlay */}
      {activeFloatingEmoji === 'end' ? (
        <div
          role="img"
          className="absolute border border-amber-300 rounded-full left-[calc(50%_-_5vh)] w-[10vh] h-[10vh] top-[-66vh] z-30 ToolBar_end__Yrr6K"
          onAnimationEnd={() => setActiveFloatingEmoji(null)}
        />
      ) : activeFloatingEmoji ? (
        <div
          aria-live="polite"
          className="absolute left-1/4 top-[-10vh] w-1/2 flex justify-center drop-shadow-2xl cursor-none z-30 ToolBar_floater__kf3jH"
          onAnimationEnd={() => setActiveFloatingEmoji('end')}
        >
          <span className="text-[15vh] animate-bounce">{activeFloatingEmoji}</span>
        </div>
      ) : null}
    </div>
  );
}
