export type DeitySpriteVisual = {
  sheet: string;
  frameDurationMs: number;
  frameCount: number;
  rows: number;
  cols: number;
};

/** Generated runtime art. Deities without an entry intentionally use the
 * scene placeholder until their matching sprite pack has been accepted. */
export const DEITY_SPRITE_VISUALS: Record<string, DeitySpriteVisual> = {
  vercel: {
    sheet: '/temple-deities/vercel/idle/sheet-transparent.png',
    frameDurationMs: 150,
    frameCount: 6,
    rows: 2,
    cols: 3
  },
  netlify: {
    sheet: '/temple-deities/netlify/idle/sheet-transparent.png',
    frameDurationMs: 150,
    frameCount: 6,
    rows: 2,
    cols: 3
  },
  cloudflare: {
    sheet: '/temple-deities/cloudflare/idle/sheet-transparent.png',
    frameDurationMs: 150,
    frameCount: 6,
    rows: 2,
    cols: 3
  },
  github: {
    sheet: '/temple-deities/github/idle/sheet-transparent.png',
    frameDurationMs: 150,
    frameCount: 6,
    rows: 2,
    cols: 3
  },
  gitlab: {
    sheet: '/temple-deities/gitlab/idle/sheet-transparent.png',
    frameDurationMs: 150,
    frameCount: 6,
    rows: 2,
    cols: 3
  },
  bitbucket: {
    sheet: '/temple-deities/bitbucket/idle/sheet-transparent.png',
    frameDurationMs: 150,
    frameCount: 6,
    rows: 2,
    cols: 3
  },
  supabase: {
    sheet: '/temple-deities/supabase/idle/sheet-transparent.png',
    frameDurationMs: 150,
    frameCount: 6,
    rows: 2,
    cols: 3
  },
  firebase: {
    sheet: '/temple-deities/firebase/idle/sheet-transparent.png',
    frameDurationMs: 150,
    frameCount: 6,
    rows: 2,
    cols: 3
  },
  postgresql: {
    sheet: '/temple-deities/postgresql/idle/sheet-transparent.png',
    frameDurationMs: 150,
    frameCount: 6,
    rows: 2,
    cols: 3
  },
  openai: {
    sheet: '/temple-deities/openai/idle/sheet-transparent.png',
    frameDurationMs: 150,
    frameCount: 6,
    rows: 2,
    cols: 3
  },
  claude: {
    sheet: '/temple-deities/claude/idle/sheet-transparent.png',
    frameDurationMs: 150,
    frameCount: 6,
    rows: 2,
    cols: 3
  },
  gemini: {
    sheet: '/temple-deities/gemini/idle/sheet-transparent.png',
    frameDurationMs: 150,
    frameCount: 6,
    rows: 2,
    cols: 3
  },
  aws: {
    sheet: '/temple-deities/aws/idle/sheet-transparent.png',
    frameDurationMs: 150,
    frameCount: 6,
    rows: 2,
    cols: 3
  },
  gcp: {
    sheet: '/temple-deities/google-cloud/idle/sheet-transparent.png',
    frameDurationMs: 150,
    frameCount: 6,
    rows: 2,
    cols: 3
  },
  azure: {
    sheet: '/temple-deities/azure/idle/sheet-transparent.png',
    frameDurationMs: 150,
    frameCount: 6,
    rows: 2,
    cols: 3
  },
  sentry: {
    sheet: '/temple-deities/sentry/idle/sheet-transparent.png',
    frameDurationMs: 150,
    frameCount: 6,
    rows: 2,
    cols: 3
  },
  datadog: {
    sheet: '/temple-deities/datadog/idle/sheet-transparent.png',
    frameDurationMs: 150,
    frameCount: 6,
    rows: 2,
    cols: 3
  },
  grafana: {
    sheet: '/temple-deities/grafana/idle/sheet-transparent.png',
    frameDurationMs: 150,
    frameCount: 6,
    rows: 2,
    cols: 3
  }
};
