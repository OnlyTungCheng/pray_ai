'use client';

import type { ReactNode } from 'react';
import { SCENE_CONFIGS } from './scene-config';
import type { SceneTheme } from './scene-types';
import { useSceneParallax } from './useSceneParallax';

type TempleSceneProps = {
  energy: number;
  incenseCount: number;
  theme?: SceneTheme;
  gods?: ReactNode;
  children: ReactNode;
};

export default function TempleScene({ energy, incenseCount, theme = 'basic', gods, children }: TempleSceneProps) {
  const offset = useSceneParallax();
  const config = SCENE_CONFIGS[theme];
  const glow = Math.max(0.2, Math.min(0.85, energy / 100));
  const atmosphere = Math.min(0.75, 0.2 + incenseCount * 0.035);

  return (
    <section className={`temple-scene-v1 temple-scene-${theme}`} aria-label={config.label}>
      {config.layers.filter((layer) => layer.src).map((layer) => (
        <img key={layer.id} src={layer.src} alt="" aria-hidden="true"
          className={`temple-scene-layer temple-scene-${layer.id}${layer.mobileHidden ? ' temple-scene-mobile-hidden' : ''}`}
          style={{ zIndex: layer.zIndex, opacity: layer.opacity, transform: `translate3d(${offset.x * layer.parallax}px, ${offset.y * layer.parallax}px, 0)` }} />
      ))}
      {gods && <div className="temple-scene-deities" style={{ left: `${config.anchors.deities.x}%`, top: `${config.anchors.deities.y}%`, width: `${config.anchors.deities.width}%` }}>{gods}</div>}
      <div className="temple-scene-haze" style={{ opacity: atmosphere }} aria-hidden="true" />
      <div className="temple-scene-energy" style={{ opacity: glow }} aria-hidden="true" />
      <div className="temple-scene-plaque" style={{ left: `${config.anchors.plaque.x}%`, top: `${config.anchors.plaque.y}%`, width: `${config.anchors.plaque.width}%`, height: `${config.anchors.plaque.height}%`, transform: `translate3d(calc(-50% + ${offset.x * 5}px), ${offset.y * 5}px, 0)` }}>{config.plaque}</div>
      <div className="temple-scene-content">{children}</div>
    </section>
  );
}
