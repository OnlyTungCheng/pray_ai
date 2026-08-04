'use client';

import Image from 'next/image';
import { DEITIES } from './TechDeities';

type RemixDeitiesProps = { activeDeityId: string; onSelectDeity: (id: string) => void };

export default function RemixDeities({ activeDeityId, onSelectDeity }: RemixDeitiesProps) {
  return <div className="remix-deities" role="group" aria-label="Ba DJ Vinahouse">
    {DEITIES.map((deity) => {
      const selected = deity.id === activeDeityId;
      const name = deity.name.replace('Thần', 'DJ');
      // next/image rejects local source URLs with an unconfigured query string.
      const imageSrc = deity.partyImg.split('?')[0];
      return <button key={deity.id} type="button" onClick={() => onSelectDeity(deity.id)} aria-pressed={selected} aria-label={`Chọn ${name}`} className={`remix-deity${selected ? ' is-selected' : ''}`}>
        <span className="remix-deity-image"><Image src={imageSrc} alt="" fill sizes="(max-width: 768px) 24vw, 15vw" priority className="object-cover" /></span>
        <span className="remix-deity-name">{name}</span>
      </button>;
    })}
  </div>;
}
