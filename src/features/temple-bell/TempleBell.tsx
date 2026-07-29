type TempleBellProps = {
  bellCount: number;
  strikeKey: number;
  onRing: () => void;
  disabled?: boolean;
};

export default function TempleBell({ bellCount, strikeKey, onRing, disabled }: TempleBellProps) {
  return (
    <button
      type="button"
      onClick={onRing}
      disabled={disabled}
      aria-label="Gõ chuông chùa cho cả phòng"
      title="Gõ chuông cho cả phòng"
      className="group relative z-30 flex flex-col items-center gap-0.5 text-amber-100 disabled:cursor-not-allowed disabled:opacity-50"
    >
      <span key={strikeKey} className={`temple-bell-visual ${strikeKey > 0 ? 'is-ringing' : ''}`}>
        <img src="/temple-bell-v1.png" alt="Chuông đồng chùa" draggable={false} />
      </span>
      <span className="rounded-full border border-amber-400/35 bg-stone-950/80 px-3 py-1 text-[10px] font-black uppercase tracking-wider shadow-lg backdrop-blur-sm transition-colors group-hover:border-amber-300 group-hover:bg-amber-500/15">
        🔔 Gõ chuông <span className="ml-1 text-amber-300">{bellCount}</span>
      </span>
    </button>
  );
}
