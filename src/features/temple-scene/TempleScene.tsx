'use client';

import type { ReactNode } from 'react';
import { TEMPLE_SCENE_ANCHORS, TEMPLE_SCENE_LAYERS } from './scene-config';
import { useSceneParallax } from './useSceneParallax';

type TempleSceneProps = {
  energy: number;
  incenseCount: number;
  gods?: ReactNode;
  children: ReactNode;
};

export default function TempleScene({ energy, incenseCount, gods, children }: TempleSceneProps) {
  const offset = useSceneParallax();
  const glow = Math.max(0.2, Math.min(0.85, energy / 100));
  const atmosphere = Math.min(0.75, 0.2 + incenseCount * 0.035);

  return (
    <section className="temple-scene-v1" aria-label="Không gian đền cầu nguyện">
      {TEMPLE_SCENE_LAYERS.filter((layer) => layer.src).map((layer) => (
        <img
          key={layer.id}
          src={layer.src}
          alt=""
          aria-hidden="true"
          className={`temple-scene-layer temple-scene-${layer.id}${layer.mobileHidden ? ' temple-scene-mobile-hidden' : ''}`}
          style={{
            zIndex: layer.zIndex,
            opacity: layer.opacity,
            transform: `translate3d(${offset.x * layer.parallax}px, ${offset.y * layer.parallax}px, 0)`
          }}
        />
      ))}

      {gods && <div className="temple-scene-deities">{gods}</div>}
      <div className="temple-scene-haze" style={{ opacity: atmosphere }} aria-hidden="true" />
      <div className="temple-scene-energy" style={{ opacity: glow }} aria-hidden="true" />
      <div
        className="temple-scene-plaque"
        style={{
          left: `${TEMPLE_SCENE_ANCHORS.plaque.x}%`,
          top: `${TEMPLE_SCENE_ANCHORS.plaque.y}%`,
          width: `${TEMPLE_SCENE_ANCHORS.plaque.width}%`,
          height: `${TEMPLE_SCENE_ANCHORS.plaque.height}%`,
          transform: `translate3d(calc(-50% + ${offset.x * 5}px), ${offset.y * 5}px, 0)`
        }}
      >
        Đền Cầu Nguyện
      </div>
      <div className="temple-scene-content">{children}</div>
    </section>
  );
}
