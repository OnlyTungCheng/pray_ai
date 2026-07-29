"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import type { OracleTier } from "@/features/oracle/types";

type Props = {
  tier: OracleTier;
  tierLabel: string;
  message: string;
  projectName: string;
};

const TIER_STYLES: Record<
  OracleTier,
  { bg: string; text: string; glow: string; border: string; emoji: string }
> = {
  dai_cat: {
    bg: "bg-emerald-950/80",
    text: "text-emerald-300",
    glow: "shadow-[0_0_50px_rgba(16,185,129,0.5)]",
    border: "border-emerald-400",
    emoji: "🌟",
  },
  cat: {
    bg: "bg-teal-950/80",
    text: "text-teal-300",
    glow: "shadow-[0_0_40px_rgba(20,184,166,0.4)]",
    border: "border-teal-400",
    emoji: "✨",
  },
  binh: {
    bg: "bg-amber-950/80",
    text: "text-amber-300",
    glow: "shadow-[0_0_30px_rgba(245,158,11,0.3)]",
    border: "border-amber-400",
    emoji: "⚖️",
  },
  hung: {
    bg: "bg-orange-950/80",
    text: "text-orange-300",
    glow: "shadow-[0_0_40px_rgba(249,115,22,0.4)]",
    border: "border-orange-500",
    emoji: "⚠️",
  },
  dai_hung: {
    bg: "bg-red-950/80",
    text: "text-red-400",
    glow: "shadow-[0_0_50px_rgba(239,68,68,0.6)]",
    border: "border-red-500",
    emoji: "🔥",
  },
};

const TIER_CARD_ASSETS: Record<OracleTier, string> = {
  dai_cat: "/oracle-cards-v1/oracle-card-1.png",
  cat: "/oracle-cards-v1/oracle-card-2.png",
  binh: "/oracle-cards-v1/oracle-card-3.png",
  hung: "/oracle-cards-v1/oracle-card-4.png",
  dai_hung: "/oracle-cards-v1/oracle-card-5.png",
};

export default function OracleResultView({
  tier,
  tierLabel,
  message,
  projectName,
}: Props) {
  const router = useRouter();
  const [isFlipped, setIsFlipped] = useState(false);
  const style = TIER_STYLES[tier];

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href);
    alert(
      "Đã copy đường dẫn quẻ! Hãy gửi cho đồng nghiệp để khoe vận may deploy.",
    );
  };

  return (
    <div className="w-full min-h-screen bg-[#1c1917] bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-stone-900/50 via-[#181615] to-black text-stone-100 flex flex-col justify-center items-center p-4 py-8 overflow-y-auto overflow-x-hidden">
      <div className="w-full max-w-md text-center mb-6 z-10 shrink-0">
        <span className="inline-block px-3 py-1 rounded-full bg-amber-500/10 text-amber-400 font-bold text-[10px] sm:text-xs uppercase tracking-wider mb-2 border border-amber-500/20">
          📜 Quẻ Deploy Đã Rút 📜
        </span>
        <h1 className="text-xl sm:text-2xl font-black font-display text-amber-200 px-2 leading-snug">
          QUẺ CHO DỰ ÁN: {projectName.toUpperCase()}
        </h1>
      </div>

      {/* Flip Card Container */}
      <div
        className="relative h-[55vh] sm:h-[65vh] max-h-[600px] aspect-[1/2] cursor-pointer group perspective z-20 shrink-0 overflow-hidden"
        onClick={() => setIsFlipped(!isFlipped)}
      >
        <div
          className={`w-full h-full relative transition-transform duration-1000 [transform-style:preserve-3d] ${isFlipped ? "[transform:rotateY(180deg)]" : ""}`}
        >
          {/* Front Side: Full Image (No CSS borders/shadows, let the asset's own border shine) */}
          <div className="absolute inset-0 [backface-visibility:hidden] flex items-center justify-center">
            <Image
              src={TIER_CARD_ASSETS[tier]}
              alt="Mặt trước quẻ"
              fill
              priority
              className="object-cover filter drop-shadow-2xl"
            />
            {/* Pulsing Hint Overlay */}
            <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-10">
              <span className="bg-stone-900/90 text-amber-300 px-4 py-2 rounded-full font-bold text-sm tracking-wider shadow-2xl animate-pulse border border-amber-500/50 backdrop-blur-md">
                Nhấn để lật quẻ
              </span>
            </div>
          </div>

          {/* Back Side: Content (Use a simple background that fits the card bounds) */}
          <div
            className={`absolute inset-0 [backface-visibility:hidden] [transform:rotateY(180deg)] rounded-[2rem] p-5 sm:p-6 flex flex-col items-center justify-between shadow-2xl ${style.bg} border-4 ${style.border} ${style.glow}`}
          >
            <div className="text-3xl sm:text-4xl mt-1">⛩️</div>

            <div className="relative h-24 sm:h-28 w-full my-2">
              <Image
                src={TIER_CARD_ASSETS[tier]}
                alt={`Minh hoạ quẻ ${tierLabel}`}
                fill
                className="object-contain drop-shadow-lg opacity-90"
              />
            </div>

            <div
              className={`text-2xl sm:text-3xl font-black font-display uppercase tracking-widest ${style.text} my-1 text-center drop-shadow-md`}
            >
              {style.emoji} {tierLabel.toUpperCase()} {style.emoji}
            </div>

            <div className="flex-1 flex flex-col justify-center items-center text-center px-1 py-1 overflow-y-auto scrollbar-none w-full">
              <p className="text-sm sm:text-base font-display leading-relaxed italic text-stone-100 drop-shadow">
                "{message}"
              </p>
            </div>

            <div className="text-[9px] sm:text-[10px] text-stone-400/80 text-center mt-2 border-t border-stone-800/60 pt-2 leading-relaxed w-full px-2">
              * Kết quả mang tính giải trí. CI/CD vẫn dựa vào test, monitoring
              và rollback plan.
            </div>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-4 mt-8 z-10">
        <button
          onClick={handleShare}
          className="px-6 py-2.5 rounded-xl text-xs font-bold bg-stone-900 hover:bg-stone-800 border border-stone-700 hover:border-amber-500/50 text-amber-300 transition-all cursor-pointer shadow-lg"
        >
          🔗 Chia sẻ quẻ
        </button>

        <button
          onClick={() => router.back()}
          className="px-6 py-2.5 rounded-xl text-xs font-bold bg-amber-500 hover:bg-amber-400 text-stone-950 transition-all cursor-pointer shadow-lg"
        >
          Trở về đền 🙏
        </button>
      </div>
    </div>
  );
}
