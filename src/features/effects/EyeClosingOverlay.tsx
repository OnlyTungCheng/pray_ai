import { useEffect, useState } from "react";

type EyeClosingOverlayProps = {
  isActive: boolean;
  themeMode?: string;
  onComplete?: () => void;
  onFullyClosed?: () => void;
};

export default function EyeClosingOverlay({
  isActive,
  themeMode,
  onComplete,
  onFullyClosed,
}: EyeClosingOverlayProps) {
  const isRemix = themeMode === "remix";
  const [phase, setPhase] = useState<"idle" | "closing" | "closed" | "opening">("idle");

  useEffect(() => {
    if (isActive) {
      setPhase("closing");

      // 1. After 900ms eyelids are fully closed
      const t1 = setTimeout(() => {
        setPhase("closed");
        onFullyClosed?.();
      }, 900);

      // 2. Stay closed in deep prayer state for 2000ms, then start opening
      const t2 = setTimeout(() => {
        setPhase("opening");
      }, 2900);

      // 3. After 3800ms eyelids fully opened, reset to idle
      const t3 = setTimeout(() => {
        setPhase("idle");
        onComplete?.();
      }, 3800);

      return () => {
        clearTimeout(t1);
        clearTimeout(t2);
        clearTimeout(t3);
      };
    } else {
      setPhase("idle");
    }
  }, [isActive, onComplete]);

  if (phase === "idle") return null;

  const isClosedOrClosing = phase === "closing" || phase === "closed";

  return (
    <div className="fixed inset-0 z-50 pointer-events-none overflow-hidden flex flex-col justify-between">
      {/* Top Eyelid */}
      <div
        className={`w-full bg-stone-950 transition-all duration-1000 ease-in-out border-b border-amber-500/20 shadow-[0_15px_50px_rgba(0,0,0,0.9)] ${
          isClosedOrClosing ? "h-1/2" : "h-0"
        }`}
      />

      {/* Center Deep Meditation Glow (when eyes are closed) */}
      <div
        className={`absolute inset-0 flex flex-col items-center justify-center transition-opacity duration-700 ${
          phase === "closed" ? "opacity-100" : "opacity-0"
        }`}
      >
        <div className={`w-28 h-28 rounded-full blur-2xl animate-pulse ${isRemix ? "bg-fuchsia-500/20" : "bg-amber-500/15"}`} />
        <span className={`font-serif italic text-lg md:text-2xl font-bold tracking-widest animate-pulse mt-4 text-shadow ${isRemix ? "text-pink-200/95" : "text-amber-200/95"}`}>
          🧘 Thành tâm nhắm mắt khấn nguyện...
        </span>
      </div>

      {/* Bottom Eyelid */}
      <div
        className={`w-full bg-stone-950 transition-all duration-1000 ease-in-out border-t border-amber-500/20 shadow-[0_-15px_50px_rgba(0,0,0,0.9)] ${
          isClosedOrClosing ? "h-1/2" : "h-0"
        }`}
      />
    </div>
  );
}
