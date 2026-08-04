type BottomActionBarProps = {
  onPray: () => void;
  onAddStick: () => void;
  onRingBell: () => void;
  onOpenOffering: () => void;
  isBellDisabled?: boolean;
  themeMode?: string;
};

export default function BottomActionBar({ onPray, onAddStick, onRingBell, onOpenOffering, isBellDisabled = false, themeMode }: BottomActionBarProps) {
  const isRemix = themeMode === 'remix';
  const actions = [
    { icon: '🙏', label: isRemix ? 'Drop lời ước' : 'Khấn', hint: isRemix ? 'Mở lời ước lên sân khấu' : 'Gửi lời cầu nguyện', tone: isRemix ? 'fuchsia' : 'purple', onClick: onPray },
    { icon: isRemix ? '🎇' : '🔥', label: isRemix ? 'Cắm pháo' : 'Thắp hương', hint: isRemix ? 'Thắp sparkler cho bàn DJ' : 'Thành tâm cầu nguyện', tone: isRemix ? 'pink' : 'amber', onClick: onAddStick },
    { icon: isRemix ? '🔊' : '🔔', label: isRemix ? 'Bass drop' : 'Gõ chuông', hint: isRemix ? 'Đánh nhịp sân khấu' : 'Gõ chuông thức tỉnh năng lượng', tone: 'sky', onClick: onRingBell, disabled: isBellDisabled },
    { icon: '🎁', label: isRemix ? 'Tặng quà DJ' : 'Dâng lễ', hint: isRemix ? 'Đẩy năng lượng sân khấu' : 'Dâng lễ vật cầu phúc', tone: isRemix ? 'cyan' : 'emerald', onClick: onOpenOffering }
  ];

  return <nav className={`fixed bottom-3 left-1/2 -translate-x-1/2 z-40 backdrop-blur-xl rounded-3xl px-5 md:px-8 py-3 shadow-[0_10px_35px_rgba(0,0,0,0.9)] flex items-center justify-around gap-4 md:gap-8 max-w-xl w-[94vw] sm:w-auto ${isRemix ? 'bg-[#16061f]/86 border border-fuchsia-400/35' : 'bg-stone-950/80 border border-stone-800/80'}`} aria-label="Nghi thức nhanh">
    {actions.map((action) => <button key={action.label} type="button" onClick={action.onClick} disabled={action.disabled} aria-label={action.label} className="group flex flex-col items-center gap-1 cursor-pointer bg-transparent border-none focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed">
      <span className={`remix-action-icon remix-action-${action.tone}`}>{action.icon}</span>
      <span className={`text-[11px] md:text-xs font-black transition-colors ${isRemix ? 'text-pink-100 group-hover:text-cyan-200' : 'text-stone-200 group-hover:text-amber-300'}`}>{action.label}</span>
      <span className="text-[9px] text-stone-400 font-medium hidden sm:block">{action.hint}</span>
    </button>)}
  </nav>;
}
