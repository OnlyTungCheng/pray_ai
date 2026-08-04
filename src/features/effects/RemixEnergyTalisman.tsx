'use client';

import type { CSSProperties } from 'react';

type RemixEnergyTalismanProps = { energy: number; incenseCount: number };

/** Visual-only room signal driven by the persisted room energy and sparklers. */
export default function RemixEnergyTalisman({ energy, incenseCount }: RemixEnergyTalismanProps) {
  const intensity = Math.max(0.3, Math.min(1, (energy + incenseCount * 8) / 100));
  const isCharged = energy >= 70 || incenseCount >= 3;

  return <div className={`remix-energy-talisman${isCharged ? ' is-charged' : ''}`} style={{ '--remix-energy': intensity } as CSSProperties} aria-hidden="true">
    <img src="/remix-neon-talisman-v1.png" alt="" />
  </div>;
}
