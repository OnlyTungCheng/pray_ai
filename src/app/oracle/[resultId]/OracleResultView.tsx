'use client';

import { useRouter } from 'next/navigation';
import type { OracleTier } from '@/features/oracle/types';

type Props = {
  tier: OracleTier;
  tierLabel: string;
  message: string;
  projectName: string;
};

const TIER_STYLES: Record<OracleTier, { bg: string; text: string; glow: string; border: string; emoji: string }> = {
  dai_cat: {
    bg: 'bg-emerald-950/80',
    text: 'text-emerald-300',
    glow: 'shadow-[0_0_50px_rgba(16,185,129,0.5)]',
    border: 'border-emerald-400',
    emoji: '🌟'
  },
  cat: {
    bg: 'bg-teal-950/80',
    text: 'text-teal-300',
    glow: 'shadow-[0_0_40px_rgba(20,184,166,0.4)]',
    border: 'border-teal-400',
    emoji: '✨'
  },
  binh: {
    bg: 'bg-amber-950/80',
    text: 'text-amber-300',
    glow: 'shadow-[0_0_30px_rgba(245,158,11,0.3)]',
    border: 'border-amber-400',
    emoji: '⚖️'
  },
  hung: {
    bg: 'bg-orange-950/80',
    text: 'text-orange-300',
    glow: 'shadow-[0_0_40px_rgba(249,115,22,0.4)]',
    border: 'border-orange-500',
    emoji: '⚠️'
  },
  dai_hung: {
    bg: 'bg-red-950/80',
    text: 'text-red-400',
    glow: 'shadow-[0_0_50px_rgba(239,68,68,0.6)]',
    border: 'border-red-500',
    emoji: '🔥'
  }
};

export default function OracleResultView({ tier, tierLabel, message, projectName }: Props) {
  const router = useRouter();
  const style = TIER_STYLES[tier];

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href);
    alert('Đã copy đường dẫn quẻ! Hãy gửi cho đồng nghiệp để khoe vận may deploy.');
  };

  return (
    <div className="w-full min-h-screen bg-[#1c1917] bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-stone-900/50 via-[#181615] to-black text-stone-100 flex flex-col justify-center items-center p-4">
      <div className="w-full max-w-md text-center mb-8">
        <span className="inline-block px-3 py-1 rounded-full bg-amber-500/10 text-amber-400 font-bold text-xs uppercase tracking-wider mb-2 border border-amber-500/20">
          📜 Quẻ Deploy Đã Rút 📜
        </span>
        <h1 className="text-2xl font-black font-serif text-amber-200">QUẺ CHO DỰ ÁN: {projectName.toUpperCase()}</h1>
      </div>

      <div
        className={`w-full max-w-sm rounded-[2rem] border-4 p-8 flex flex-col items-center justify-between transition-all duration-700 min-h-[50vh] backdrop-blur-xl ${style.bg} ${style.border} ${style.glow}`}
      >
        <div className="text-3xl mb-4">⛩️</div>

        <div className={`text-3xl font-black font-serif uppercase tracking-widest ${style.text} mb-6`}>
          {style.emoji} {tierLabel.toUpperCase()} {style.emoji}
        </div>

        <div className="flex-1 flex flex-col justify-center items-center text-center px-2 py-4">
          <p className="text-lg md:text-xl font-serif leading-relaxed italic text-stone-100">"{message}"</p>
        </div>

        <div className="text-[10px] text-stone-500 text-center mt-6 border-t border-stone-800/60 pt-4 leading-relaxed">
          * Kết quả chỉ mang tính giải trí. CI/CD vẫn nên dựa vào test, monitoring và rollback plan.
        </div>
      </div>

      <div className="flex items-center gap-4 mt-8">
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
