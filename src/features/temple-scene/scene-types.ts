export type SceneAnchor = {
  x: number;
  y: number;
  width: number;
  height: number;
};

export type SceneLayerConfig = {
  id: string;
  src?: string;
  zIndex: number;
  parallax: number;
  opacity?: number;
  mobileHidden?: boolean;
};

export type SceneTheme = 'basic' | 'remix';

export type SceneConfig = {
  layers: SceneLayerConfig[];
  anchors: Record<'plaque' | 'altar' | 'bell' | 'offering' | 'deities', SceneAnchor>;
  label: string;
  plaque: string;
};
