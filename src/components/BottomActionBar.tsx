type BottomActionBarProps = {
  onPray: () => void;
  onAddStick: () => void;
  onRingBell: () => void;
  onOpenOffering: () => void;
  isBellDisabled?: boolean;
};
export default function BottomActionBar({
  onPray,
  onAddStick,
  onRingBell,
  onOpenOffering,
  isBellDisabled = false,
}: BottomActionBarProps) {
  return (
    <div className="fixed bottom-3 left-1/2 -translate-x-1/2 z-40 bg-stone-950/80 backdrop-blur-xl border border-stone-800/80 rounded-3xl px-5 md:px-8 py-3 shadow-[0_10px_35px_rgba(0,0,0,0.9)] flex items-center justify-around gap-4 md:gap-8 max-w-xl w-[94vw] sm:w-auto">
      {/* 1. Khấn */}
      <button
        type="button"
        onClick={onPray}
        aria-label="Khấn nguyện"
        className="group flex flex-col items-center gap-1 cursor-pointer bg-transparent border-none focus:outline-none"
      >
        <div className="w-11 h-11 md:w-14 md:h-14 rounded-full border-2 border-purple-500/80 bg-purple-950/60 text-purple-200 flex items-center justify-center text-lg md:text-2xl shadow-[0_0_20px_rgba(168,85,247,0.4)] group-hover:scale-110 group-hover:border-purple-300 group-hover:shadow-[0_0_30px_rgba(168,85,247,0.7)] active:scale-95 transition-all duration-300">
          🙏
        </div>
        <span className="text-[11px] md:text-xs font-black text-stone-200 group-hover:text-purple-300 transition-colors">
          Khấn
        </span>
        <span className="text-[9px] text-stone-400 font-medium hidden sm:block">
          Gửi lời cầu nguyện
        </span>
      </button>
      {/* 2. Thắp hương */}
      <button
        type="button"
        onClick={onAddStick}
        aria-label="Thắp hương"
        className="group flex flex-col items-center gap-1 cursor-pointer bg-transparent border-none focus:outline-none"
      >
        <div className="w-11 h-11 md:w-14 md:h-14 rounded-full border-2 border-amber-500/80 bg-amber-950/60 text-amber-200 flex items-center justify-center text-lg md:text-2xl shadow-[0_0_20px_rgba(245,158,11,0.4)] group-hover:scale-110 group-hover:border-amber-300 group-hover:shadow-[0_0_30px_rgba(245,158,11,0.7)] active:scale-95 transition-all duration-300">
          🔥
        </div>
        <span className="text-[11px] md:text-xs font-black text-stone-200 group-hover:text-amber-300 transition-colors">
          Thắp hương
        </span>
        <span className="text-[9px] text-stone-400 font-medium hidden sm:block">
          Thành tâm cầu nguyện
        </span>
      </button>
      {/* 3. Gõ chuông */}
      <button
        type="button"
        onClick={onRingBell}
        disabled={isBellDisabled}
        aria-label="Gõ chuông"
        className="group flex flex-col items-center gap-1 cursor-pointer bg-transparent border-none focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <div className="w-11 h-11 md:w-14 md:h-14 rounded-full border-2 border-sky-500/80 bg-sky-950/60 text-sky-200 flex items-center justify-center text-lg md:text-2xl shadow-[0_0_20px_rgba(14,165,233,0.4)] group-hover:scale-110 group-hover:border-sky-300 group-hover:shadow-[0_0_30px_rgba(14,165,233,0.7)] active:scale-95 transition-all duration-300">
          🔔
        </div>
        <span className="text-[11px] md:text-xs font-black text-stone-200 group-hover:text-sky-300 transition-colors">
          Gõ chuông
        </span>
        <span className="text-[9px] text-stone-400 font-medium hidden sm:block">
          Gõ chuông thức tỉnh năng lượng
        </span>
      </button>
      {/* 4. Dâng lễ */}
      <button
        type="button"
        onClick={onOpenOffering}
        aria-label="Dâng lễ"
        className="group flex flex-col items-center gap-1 cursor-pointer bg-transparent border-none focus:outline-none"
      >
        <div className="w-11 h-11 md:w-14 md:h-14 rounded-full border-2 border-emerald-500/80 bg-emerald-950/60 text-emerald-200 flex items-center justify-center text-lg md:text-2xl shadow-[0_0_20px_rgba(16,185,129,0.4)] group-hover:scale-110 group-hover:border-emerald-300 group-hover:shadow-[0_0_30px_rgba(16,185,129,0.7)] active:scale-95 transition-all duration-300">
          🎁
        </div>
        <span className="text-[11px] md:text-xs font-black text-stone-200 group-hover:text-emerald-300 transition-colors">
          Dâng lễ
        </span>
        <span className="text-[9px] text-stone-400 font-medium hidden sm:block">
          Dâng lễ vật cầu phúc
        </span>
      </button>
    </div>
  );
}
