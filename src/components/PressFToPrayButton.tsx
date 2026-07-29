import { useEffect } from "react";

type PressFToPrayButtonProps = {
  onTriggerPray: () => void;
  disabled?: boolean;
};

export default function PressFToPrayButton({
  onTriggerPray,
  disabled = false,
}: PressFToPrayButtonProps) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger if user is typing in an input, textarea, or contentEditable
      const target = e.target as HTMLElement | null;
      if (
        target &&
        (target.tagName === "INPUT" ||
          target.tagName === "TEXTAREA" ||
          target.isContentEditable)
      ) {
        return;
      }

      if (e.key === "f" || e.key === "F") {
        if (!disabled) {
          e.preventDefault();
          onTriggerPray();
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onTriggerPray, disabled]);

  return (
    <button
      type="button"
      onClick={onTriggerPray}
      disabled={disabled}
      aria-label="Press F to pray"
      title="Bấm phím [F] trên bàn phím hoặc nhấp nút này để nhắm mắt khấn nguyện"
      className="fixed bottom-3 left-[calc(50%+190px)] sm:left-[calc(50%+250px)] z-40 bg-stone-950/80 backdrop-blur-xl border border-amber-500/40 hover:border-amber-400 rounded-3xl px-3.5 md:px-4 py-2.5 shadow-[0_10px_35px_rgba(0,0,0,0.9)] flex items-center gap-2.5 text-amber-200 cursor-pointer hover:scale-105 active:scale-95 transition-all group disabled:opacity-50 disabled:cursor-not-allowed"
    >
      {/* Keyboard Key Icon Badge */}
      <span className="w-7 h-7 md:w-8 md:h-8 rounded-xl bg-stone-900 border border-amber-400/60 flex items-center justify-center font-black text-xs md:text-sm text-amber-300 shadow-inner group-hover:bg-amber-500/20 group-hover:border-amber-300 transition-colors">
        F
      </span>

      <div className="flex flex-col items-start text-left">
        <span className="text-[11px] md:text-xs font-black tracking-wide text-amber-100 group-hover:text-amber-300 transition-colors">
          Press F for pray
        </span>
        <span className="text-[9px] text-stone-400 font-medium hidden md:inline">
          Nhắm mắt khấn
        </span>
      </div>
    </button>
  );
}
