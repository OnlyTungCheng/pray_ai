import { useEffect } from "react";

type PressFToPrayButtonProps = { onTriggerPray: () => void; disabled?: boolean; themeMode?: string };

export default function PressFToPrayButton({ onTriggerPray, disabled = false, themeMode }: PressFToPrayButtonProps) {
  const isRemix = themeMode === 'remix';
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable)) return;
      if ((event.key === 'f' || event.key === 'F') && !disabled) { event.preventDefault(); onTriggerPray(); }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onTriggerPray, disabled]);

  return <button type="button" onClick={onTriggerPray} disabled={disabled} aria-label="Press F to pray" title="Bấm phím F hoặc nhấp để bắt đầu" className={`fixed bottom-3 left-[calc(50%+190px)] sm:left-[calc(50%+250px)] z-40 backdrop-blur-xl rounded-3xl px-3.5 md:px-4 py-2.5 shadow-[0_10px_35px_rgba(0,0,0,0.9)] flex items-center gap-2.5 cursor-pointer hover:scale-105 active:scale-95 transition-all group disabled:opacity-50 disabled:cursor-not-allowed ${isRemix ? 'bg-fuchsia-950/85 border border-fuchsia-400/55 text-pink-100 hover:border-cyan-300' : 'bg-stone-950/80 border border-amber-500/40 text-amber-200 hover:border-amber-400'}`}>
    <span className={`w-7 h-7 md:w-8 md:h-8 rounded-xl bg-stone-900 border flex items-center justify-center font-black text-xs md:text-sm shadow-inner transition-colors ${isRemix ? 'border-cyan-300/70 text-cyan-200 group-hover:bg-fuchsia-500/30' : 'border-amber-400/60 text-amber-300 group-hover:bg-amber-500/20'}`}>F</span>
    <span className="flex flex-col items-start text-left"><span className="text-[11px] md:text-xs font-black tracking-wide">{isRemix ? 'Press F to drop' : 'Press F for pray'}</span><span className="text-[9px] text-stone-400 font-medium hidden md:inline">{isRemix ? 'Mở lời ước lên sân khấu' : 'Nhắm mắt khấn'}</span></span>
  </button>;
}
