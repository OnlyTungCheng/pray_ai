import type { SceneAnchor, SceneConfig, SceneLayerConfig, SceneTheme } from './scene-types';

export const TEMPLE_SCENE_CANVAS = { width: 1536, height: 864 } as const;

const BASIC_LAYERS: SceneLayerConfig[] = [
  { id: 'backdrop', src: '/cyber-temple-background-v1.png', zIndex: 0, parallax: 2 },
  { id: 'architecture', src: '/temple-scene-v1/cyber-temple-foreground-depth.png', zIndex: 10, parallax: 9 },
  { id: 'signage', zIndex: 16, parallax: 5 },
  { id: 'atmosphere', zIndex: 20, parallax: 1 },
  { id: 'hero', zIndex: 30, parallax: 12 },
  { id: 'foreground', zIndex: 35, parallax: 16, mobileHidden: true }
];

const BASIC_ANCHORS: Record<'plaque' | 'altar' | 'bell' | 'offering' | 'deities', SceneAnchor> = {
  plaque: { x: 50, y: 7, width: 26, height: 6 },
  altar: { x: 50, y: 69, width: 46, height: 38 },
  bell: { x: 82, y: 53, width: 12, height: 24 },
  offering: { x: 50, y: 56, width: 24, height: 10 },
  deities: { x: 50, y: 47, width: 50, height: 34 }
};

const REMIX_LAYERS: SceneLayerConfig[] = [
  { id: 'backdrop', src: '/remix-scene-v1-backdrop.png', zIndex: 0, parallax: 2 },
  { id: 'architecture', src: '/remix-scene-v1-foreground.png', zIndex: 10, parallax: 8 },
  { id: 'signage', zIndex: 16, parallax: 4 },
  { id: 'atmosphere', zIndex: 20, parallax: 1 },
  { id: 'hero', zIndex: 30, parallax: 11 },
  { id: 'foreground', zIndex: 35, parallax: 15, mobileHidden: true }
];

const REMIX_ANCHORS: Record<'plaque' | 'altar' | 'bell' | 'offering' | 'deities', SceneAnchor> = {
  plaque: { x: 50, y: 8, width: 30, height: 6 },
  altar: { x: 50, y: 71, width: 50, height: 38 },
  bell: { x: 83, y: 52, width: 12, height: 24 },
  offering: { x: 50, y: 58, width: 26, height: 10 },
  deities: { x: 50, y: 44, width: 48, height: 31 }
};

export const SCENE_CONFIGS: Record<SceneTheme, SceneConfig> = {
  basic: { layers: BASIC_LAYERS, anchors: BASIC_ANCHORS, label: 'Prayer temple scene', plaque: 'Đền Cầu Nguyện' },
  remix: { layers: REMIX_LAYERS, anchors: REMIX_ANCHORS, label: 'Vinahouse electronic stage', plaque: 'VINAHOUSE PRAYER RAVE' }
};

export const TEMPLE_SCENE_LAYERS = BASIC_LAYERS;
export const TEMPLE_SCENE_ANCHORS = BASIC_ANCHORS;
