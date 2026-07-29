import { DEVELOPER_OFFERINGS, type DeveloperOffering } from './offering-catalog';

export { DEVELOPER_OFFERINGS, type DeveloperOffering };

type OfferingTrayProps = {
  disabled?: boolean;
  onOffer: (offering: DeveloperOffering) => void;
};

export default function OfferingTray({ disabled, onOffer }: OfferingTrayProps) {
  return (
    <section className="relative z-30 mt-2 flex flex-col items-center gap-1.5" aria-label="Dâng lễ vật developer">
      <p className="rounded-full border border-amber-500/30 bg-stone-950/75 px-3 py-1 text-[10px] font-black uppercase tracking-wider text-amber-300 shadow-lg backdrop-blur-sm">
        🪷 Dâng lễ vật developer
      </p>
      <div className="flex items-center justify-center gap-1.5 rounded-2xl border border-amber-500/25 bg-stone-950/70 p-1.5 shadow-xl backdrop-blur-sm">
        {DEVELOPER_OFFERINGS.map((offering) => (
          <button
            key={offering.id}
            type="button"
            disabled={disabled}
            onClick={() => onOffer(offering)}
            title={`Dâng ${offering.label}`}
            aria-label={`Dâng ${offering.label}`}
            className="group h-11 w-11 overflow-hidden rounded-xl border border-stone-700/90 bg-stone-900/90 p-0.5 transition hover:-translate-y-1 hover:border-amber-300 hover:bg-amber-500/15 active:scale-95 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <img
              src={offering.file}
              alt=""
              draggable={false}
              className="h-full w-full object-contain transition duration-200 group-hover:scale-110"
            />
          </button>
        ))}
      </div>
    </section>
  );
}
