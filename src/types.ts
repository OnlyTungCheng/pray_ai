export interface IncenseStick {
  x: number;
  y: number;
  z: number;
  exp?: number;
  num: number;
}

export interface Wish {
  id: number;
  author: string;
  text: string;
  targetDeity: string;
  blessings: number;
  time: string;
}

export interface Deity {
  id: string;
  name: string;
  title: string;
  statueImg: string;
  glowColor: string;
  borderColor: string;
  tagBg: string;
}
