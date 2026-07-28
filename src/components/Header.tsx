interface HeaderProps {
  totalBurned: number;
  wishCount: number;
  isBrightBg: boolean;
  onToggleBg: () => void;
}

export default function Header({ totalBurned, wishCount, isBrightBg, onToggleBg }: HeaderProps) {
  return (
    <header className="w-full max-w-5xl mx-auto px-4 pt-6 pb-4 flex flex-col md:flex-row items-center justify-between gap-4 z-30 relative">
      {/* Brand & Logo */}
      <div className="flex items-center gap-3">
        <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-amber-500 to-orange-500 p-0.5 shadow-lg shadow-amber-500/20">
          <div className="w-full h-full rounded-[14px] bg-stone-950 flex items-center justify-center text-2xl">
            💻
          </div>
        </div>
        <div>
          <h1 className="text-xl md:text-2xl font-black tracking-tight text-amber-200 font-serif flex items-center gap-2">
            Đền Cầu Nguyện Dev <span className="text-xs px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 font-sans font-semibold border border-amber-500/30">Dev Sanctuary</span>
          </h1>
          <p className="text-xs text-stone-300">
            Cầu nguyện trước khi Deploy Production & Demo Khách Hàng 🚀
          </p>
        </div>
      </div>

      {/* Real-time Counters & Controls */}
      <div className="flex flex-wrap items-center gap-3">
        {/* Total Burned Badge */}
        <div className="px-3.5 py-1.5 rounded-xl bg-stone-900/90 border border-amber-500/30 backdrop-blur-md flex items-center gap-2 text-xs font-semibold text-amber-300 shadow-md">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
          <span>🔥 Đã thắp: <strong className="text-amber-200 text-sm">{totalBurned}</strong> nén hương</span>
        </div>

        {/* Total Wishes Badge */}
        <div className="px-3.5 py-1.5 rounded-xl bg-stone-900/90 border border-amber-500/30 backdrop-blur-md flex items-center gap-2 text-xs font-semibold text-amber-300 shadow-md">
          <span>📜 <strong className="text-amber-200 text-sm">{wishCount}</strong> Lời nguyện</span>
        </div>

        {/* Ambient Warmth Toggle (Nền Sáng Hơn) */}
        <button
          onClick={onToggleBg}
          className="px-3.5 py-1.5 rounded-xl bg-stone-900/90 hover:bg-stone-800 border border-stone-700 text-amber-300 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
          title="Thay đổi ánh sáng nền"
        >
          <span>{isBrightBg ? '☀️ Light Temple' : '🌙 Warm Glow'}</span>
        </button>
      </div>
    </header>
  );
}
