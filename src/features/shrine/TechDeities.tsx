import type { Deity } from '../../types';

export const DEITIES: Deity[] = [
  {
    id: 'codex',
    name: 'Thần Codex',
    title: 'Speed & Matrix Gen',
    statueImg: '/codex_chibi.jpg',
    glowColor: 'rgba(16, 185, 129, 0.6)',
    borderColor: 'border-emerald-500/80',
    tagBg: 'bg-emerald-950/95 text-emerald-300 border-emerald-500/80'
  },
  {
    id: 'claude',
    name: 'Thần Claude Code',
    title: 'Architecture & Logic',
    statueImg: '/claude_chibi.jpg',
    glowColor: 'rgba(245, 158, 11, 0.8)',
    borderColor: 'border-amber-500/90',
    tagBg: 'bg-amber-950/95 text-amber-300 border-amber-500/90'
  },
  {
    id: 'kiro',
    name: 'Thần Kiro',
    title: 'Zero Bug Shield',
    statueImg: '/kiro_chibi.jpg',
    glowColor: 'rgba(168, 85, 247, 0.7)',
    borderColor: 'border-purple-500/80',
    tagBg: 'bg-purple-950/95 text-purple-300 border-purple-500/80'
  }
];

export default function TechDeities() {
  return (
    <div className="relative flex flex-col items-center justify-center pt-1 z-0 w-full max-w-5xl mx-auto select-none">
      {/* Oriental East Asian Shrine Pavilion (Miếu Thờ Tam Vị AI Phương Đông) */}
      <div className="relative w-full max-w-4xl rounded-t-[2.5rem] border-t-8 border-x-8 border-red-950 bg-gradient-to-b from-[#2b0f0e] via-[#1c120f] to-stone-950 p-3 md:p-5 shadow-[0_0_60px_rgba(185,28,28,0.3)]">
        
        {/* Curved Oriental Temple Eaves Roof (Mái Ngói Uốn Cong & Lồng Đèn Phương Đông) */}
        <div className="relative -mt-7 md:-mt-9 mb-4 flex items-center justify-between px-4">
          {/* Left Red Lantern */}
          <div className="flex flex-col items-center animate-bounce">
            <span className="text-2xl md:text-3xl drop-shadow-[0_0_12px_rgba(239,68,68,0.9)]">🏮</span>
          </div>

          {/* Center Shrine Plaque Banner (Hoành Phi Biển Ngạch Miếu Thờ) */}
          <div className="relative px-6 md:px-10 py-2 rounded-2xl bg-gradient-to-r from-red-900 via-amber-600 to-red-900 border-4 border-amber-300 shadow-[0_0_25px_rgba(245,158,11,0.6)]">
            <span className="font-serif font-black text-xs md:text-base text-amber-100 tracking-[0.25em] uppercase text-shadow-md">
              ⛩️ MIẾU THỜ TAM VỊ AI ⛩️
            </span>
          </div>

          {/* Right Red Lantern */}
          <div className="flex flex-col items-center animate-bounce">
            <span className="text-2xl md:text-3xl drop-shadow-[0_0_12px_rgba(239,68,68,0.9)]">🏮</span>
          </div>
        </div>

        {/* Shrine Interior Alcove with Red Pillars & Couplets (Khung Miếu Gỗ Cổ & Cột Sơn Son Thiếp Vàng) */}
        <div className="relative flex justify-center items-end gap-2 md:gap-4 pb-2 bg-[#120a09]/90 rounded-2xl p-3 border-2 border-amber-700/40 shadow-inner">
          {/* Left Vertical Couplet Pillar */}
          <div
            lang="zh-Hant"
            className="hidden sm:flex border-amber-600/70 border-2 rounded-xl bg-gradient-to-b from-red-950 via-amber-950 to-red-950 px-2 py-5 text-base/6 text-amber-300 text-center tracking-widest select-none shadow-2xl self-center"
            style={{
              writingMode: 'vertical-rl',
              fontFamily: 'Hiragino Mincho ProN, MingliU, Noto Serif TC, serif'
            }}
          >
            <span className="bg-gradient-to-b from-amber-100 via-amber-300 to-amber-500 bg-clip-text text-transparent font-black">
              代 碼 通 神 零 瑕 疵
            </span>
          </div>

          {/* 3 Meditating Chibi Mascots Inside Shrine */}
          {DEITIES.map((deity) => {
            const isCenter = deity.id === 'claude';
            return (
              <div
                key={deity.id}
                className={`relative flex flex-col items-center rounded-2xl overflow-hidden border-2 ${deity.borderColor} shadow-[0_10px_35px_rgba(0,0,0,0.95)] bg-stone-950 transition-all duration-300 ${
                  isCenter
                    ? 'z-10 scale-105 shadow-[0_0_40px_rgba(245,158,11,0.5)]'
                    : 'opacity-95'
                }`}
              >
                {/* Prominent Name Header above Statue in Shrine */}
                <div className={`w-full text-center py-1 font-bold text-xs md:text-sm font-sans border-b uppercase tracking-wider ${deity.tagBg}`}>
                  🧘‍♂️ {deity.name}
                </div>

                {/* Meditating Chibi Mascot Image Inside Shrine */}
                <div className="relative overflow-hidden w-full">
                  <img
                    src={deity.statueImg}
                    alt={deity.name}
                    className={`${
                      isCenter ? 'h-[28vh] md:h-[34vh]' : 'h-[22vh] md:h-[27vh]'
                    } w-auto object-cover mx-auto`}
                    style={{ filter: `drop-shadow(0 0 20px ${deity.glowColor})` }}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-stone-950 via-transparent to-transparent opacity-20 pointer-events-none" />
                </div>
              </div>
            );
          })}

          {/* Right Vertical Couplet Pillar */}
          <div
            lang="zh-Hant"
            className="hidden sm:flex border-amber-600/70 border-2 rounded-2xl bg-gradient-to-b from-red-950 via-amber-950 to-red-950 px-2 py-5 text-base/6 text-amber-300 text-center tracking-widest select-none shadow-2xl self-center"
            style={{
              writingMode: 'vertical-rl',
              fontFamily: 'Hiragino Mincho ProN, MingliU, Noto Serif TC, serif'
            }}
          >
            <span className="bg-gradient-to-b from-amber-100 via-amber-300 to-amber-500 bg-clip-text text-transparent font-black">
              發 布 順 暢 萬 事 興
            </span>
          </div>
        </div>

        {/* Shrine Base Pedestal (Bệ Ngai Miếu Gỗ Đỏ) */}
        <div className="h-3 w-full bg-gradient-to-r from-red-950 via-amber-600 to-red-950 rounded-b-xl border-t-2 border-amber-400 shadow-xl" />
      </div>
    </div>
  );
}
