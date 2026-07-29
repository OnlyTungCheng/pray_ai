import type { SceneAnchor, SceneLayerConfig } from './scene-types';

export const TEMPLE_SCENE_CANVAS = { width: 1536, height: 864 } as const;

export const TEMPLE_SCENE_LAYERS: SceneLayerConfig[] = [
  { id: 'backdrop', src: '/cyber-temple-background-v1.png', zIndex: 0, parallax: 2 },
  { id: 'architecture', src: '/temple-scene-v1/cyber-temple-foreground-depth.png', zIndex: 10, parallax: 9 },
  { id: 'signage', zIndex: 16, parallax: 5 },
  { id: 'atmosphere', zIndex: 20, parallax: 1 },
  { id: 'hero', zIndex: 30, parallax: 12 },
  { id: 'foreground', zIndex: 35, parallax: 16, mobileHidden: true }
];

export const TEMPLE_SCENE_ANCHORS: Record<'plaque' | 'altar' | 'bell' | 'offering', SceneAnchor> = {
  plaque: { x: 50, y: 7, width: 26, height: 6 },
  altar: { x: 50, y: 69, width: 46, height: 38 },
  bell: { x: 82, y: 53, width: 12, height: 24 },
  offering: { x: 50, y: 56, width: 24, height: 10 }
};
