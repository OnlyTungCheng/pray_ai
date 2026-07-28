import type { Deity } from '../../types';

export const DEITIES: Deity[] = [
  {
    id: 'codex',
    name: 'Thần Codex',
    title: 'Speed & Matrix Gen',
    statueImg: '/codex_chibi.jpg',
    glowColor: 'rgba(16, 185, 129, 0.8)',
    borderColor: 'border-emerald-400',
    tagBg: 'bg-emerald-500 text-stone-950 border-emerald-300'
  },
  {
    id: 'claude',
    name: 'Thần Claude Code',
    title: 'Architecture & Logic',
    statueImg: '/claude_chibi.jpg',
    glowColor: 'rgba(245, 158, 11, 0.9)',
    borderColor: 'border-amber-400',
    tagBg: 'bg-amber-400 text-stone-950 border-amber-200'
  },
  {
    id: 'kiro',
    name: 'Thần Kiro',
    title: 'Zero Bug Shield',
    statueImg: '/kiro_chibi.jpg',
    glowColor: 'rgba(168, 85, 247, 0.8)',
    borderColor: 'border-purple-400',
    tagBg: 'bg-purple-400 text-stone-950 border-purple-200'
  }
];

interface TechDeitiesProps {
  themeMode?: string;
}

export default function TechDeities({ themeMode }: TechDeitiesProps) {
  const isRemix = themeMode === 'remix';

  return (
    <div className="relative flex flex-col items-center justify-center pt-1 z-0 w-full max-w-5xl mx-auto select-none">
      {/* Oriental East Asian Shrine Pavilion (Miếu Thờ Tam Vị AI Phương Đông - Bright & Crystal Clear) */}
      <div
        className={`relative w-full max-w-4xl rounded-t-[2.5rem] border-t-8 border-x-8 transition-all duration-700 p-3 md:p-5 ${
          isRemix
            ? 'border-fuchsia-500 bg-gradient-to-b from-[#581c87] via-[#3b0764] to-stone-900 shadow-[0_0_90px_rgba(236,72,153,0.9)] animate-pulse'
            : 'border-amber-500 bg-gradient-to-b from-[#451a03] via-[#292524] to-stone-900 shadow-[0_0_80px_rgba(245,158,11,0.5)]'
        }`}
      >
        {/* Curved Oriental Temple Eaves Roof */}
        <div className="relative -mt-8 md:-mt-10 mb-4 flex items-center justify-between px-4">
          {/* Left Lantern */}
          <div className="flex flex-col items-center animate-bounce">
            <span className="text-3xl md:text-4xl drop-shadow-[0_0_15px_rgba(239,68,68,1)]">
              {isRemix ? '🪩' : '🏮'}
            </span>
          </div>

          {/* Center Shrine Plaque Banner */}
          <div
            className={`relative px-6 md:px-10 py-2.5 rounded-2xl border-4 shadow-2xl transition-all duration-500 ${
              isRemix
                ? 'bg-gradient-to-r from-fuchsia-600 via-pink-500 to-purple-600 border-white text-white shadow-[0_0_35px_rgba(236,72,153,1)] animate-pulse'
                : 'bg-gradient-to-r from-red-700 via-amber-500 to-red-700 border-amber-200 text-stone-950 shadow-[0_0_35px_rgba(245,158,11,0.9)]'
            }`}
          >
            <span className="font-serif font-black text-sm md:text-lg text-white tracking-[0.25em] uppercase text-shadow-lg">
              {isRemix ? '🪩 MIẾU THỜ TAM VỊ AI REMIX VINAHOUSE 🪩' : '⛩️ MIẾU THỜ TAM VỊ AI ⛩️'}
            </span>
          </div>

          {/* Right Lantern */}
          <div className="flex flex-col items-center animate-bounce">
            <span className="text-3xl md:text-4xl drop-shadow-[0_0_15px_rgba(239,68,68,1)]">
              {isRemix ? '🪩' : '🏮'}
            </span>
          </div>
        </div>

        {/* Shrine Interior Alcove */}
        <div
          className={`relative flex justify-center items-end gap-3 md:gap-5 pb-3 rounded-2xl p-3 border-2 transition-all duration-500 ${
            isRemix
              ? 'bg-[#2e1065] border-fuchsia-400 shadow-[inset_0_0_50px_rgba(236,72,153,0.6)]'
              : 'bg-[#1c1917] border-amber-500/60 shadow-[inset_0_0_50px_rgba(245,158,11,0.3)]'
          }`}
        >
          {/* Left Vertical Couplet Pillar */}
          <div
            lang="zh-Hant"
            className={`hidden sm:flex border-2 rounded-xl px-2.5 py-6 text-base/6 text-center tracking-widest select-none shadow-2xl self-center font-black ${
              isRemix
                ? 'border-pink-400 bg-gradient-to-b from-fuchsia-900 via-purple-900 to-pink-900 text-pink-200 shadow-pink-500/60'
                : 'border-amber-400 bg-gradient-to-b from-red-900 via-amber-900 to-red-900 text-amber-200 shadow-amber-500/50'
            }`}
            style={{
              writingMode: 'vertical-rl',
              fontFamily: 'Hiragino Mincho ProN, MingliU, Noto Serif TC, serif'
            }}
          >
            <span className="text-amber-200 drop-shadow-md">
              代 碼 通 神 零 瑕 疵
            </span>
          </div>

          {/* 3 Meditating Chibi Mascots Inside Shrine */}
          {DEITIES.map((deity) => {
            const isCenter = deity.id === 'claude';
            return (
              <div
                key={deity.id}
                className={`relative flex flex-col items-center rounded-2xl overflow-hidden border-4 ${
                  isRemix ? 'border-pink-400 shadow-[0_0_35px_rgba(236,72,153,0.9)]' : deity.borderColor
                } shadow-[0_15px_45px_rgba(0,0,0,0.95)] bg-stone-900 transition-all duration-300 ${
                  isCenter
                    ? 'z-10 scale-105 shadow-[0_0_50px_rgba(245,158,11,0.7)]'
                    : 'opacity-100'
                }`}
              >
                {/* Prominent Bright Name Header */}
                <div className={`w-full text-center py-1.5 font-black text-xs md:text-sm font-sans border-b uppercase tracking-wider ${deity.tagBg}`}>
                  🧘‍♂️ {deity.name}
                </div>

                {/* Crystal Clear Meditating Chibi Mascot Image */}
                <div className="relative overflow-hidden w-full bg-stone-950">
                  <img
                    src={deity.statueImg}
                    alt={deity.name}
                    className={`${
                      isCenter ? 'h-[30vh] md:h-[36vh]' : 'h-[24vh] md:h-[29vh]'
                    } w-auto object-cover mx-auto brightness-110 contrast-105 transition-transform duration-300 ${
                      isRemix ? 'animate-bounce' : ''
                    }`}
                    style={{
                      filter: isRemix
                        ? 'drop-shadow(0 0 30px rgba(236,72,153,1))'
                        : `drop-shadow(0 0 25px ${deity.glowColor})`
                    }}
                  />
                </div>
              </div>
            );
          })}

          {/* Right Vertical Couplet Pillar */}
          <div
            lang="zh-Hant"
            className={`hidden sm:flex border-2 rounded-2xl px-2.5 py-6 text-base/6 text-center tracking-widest select-none shadow-2xl self-center font-black ${
              isRemix
                ? 'border-pink-400 bg-gradient-to-b from-fuchsia-900 via-purple-900 to-pink-900 text-pink-200 shadow-pink-500/60'
                : 'border-amber-400 bg-gradient-to-b from-red-900 via-amber-900 to-red-900 text-amber-200 shadow-amber-500/50'
            }`}
            style={{
              writingMode: 'vertical-rl',
              fontFamily: 'Hiragino Mincho ProN, MingliU, Noto Serif TC, serif'
            }}
          >
            <span className="text-amber-200 drop-shadow-md">
              發 布 順 暢 萬 事 興
            </span>
          </div>
        </div>

        {/* Shrine Base Pedestal */}
        <div
          className={`h-4 w-full rounded-b-xl border-t-2 shadow-2xl transition-all duration-500 ${
            isRemix
              ? 'bg-gradient-to-r from-fuchsia-800 via-pink-500 to-purple-800 border-white'
              : 'bg-gradient-to-r from-red-800 via-amber-400 to-red-800 border-amber-200'
          }`}
        />
      </div>
    </div>
  );
}
