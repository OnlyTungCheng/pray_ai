import { DEVELOPER_OFFERINGS, type DeveloperOffering } from './offering-catalog';

export { DEVELOPER_OFFERINGS, type DeveloperOffering };

type OfferingTrayProps = { disabled?: boolean; onOffer: (offering: DeveloperOffering) => void; themeMode?: string };

export default function OfferingTray({ disabled, onOffer, themeMode }: OfferingTrayProps) {
  const isRemix = themeMode === 'remix';
  return <section className="relative z-30 mt-2 flex flex-col items-center gap-1.5" aria-label="Developer offerings">
    <p className={`rounded-full border bg-stone-950/75 px-3 py-1 text-[10px] font-black uppercase tracking-wider shadow-lg backdrop-blur-sm ${isRemix ? 'border-fuchsia-400/40 text-pink-200' : 'border-amber-500/30 text-amber-300'}`}>{isRemix ? '🎛️ Tặng quà cho DJ' : '🪷 Dâng lễ vật developer'}</p>
    <div className={`flex items-center justify-center gap-1.5 rounded-2xl border bg-stone-950/70 p-1.5 shadow-xl backdrop-blur-sm ${isRemix ? 'border-cyan-400/25' : 'border-amber-500/25'}`}>
      {DEVELOPER_OFFERINGS.map((offering) => <button key={offering.id} type="button" disabled={disabled} onClick={() => onOffer(offering)} title={`Dâng ${offering.label}`} aria-label={`Dâng ${offering.label}`} className={`group h-11 w-11 overflow-hidden rounded-xl border border-stone-700/90 bg-stone-900/90 p-0.5 transition hover:-translate-y-1 active:scale-95 disabled:cursor-not-allowed disabled:opacity-50 ${isRemix ? 'hover:border-cyan-300 hover:bg-fuchsia-500/15' : 'hover:border-amber-300 hover:bg-amber-500/15'}`}>
        <img src={offering.file} alt="" draggable={false} className="h-full w-full object-contain transition duration-200 group-hover:scale-110" />
      </button>)}
    </div>
  </section>;
}
