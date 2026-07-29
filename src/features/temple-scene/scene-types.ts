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
