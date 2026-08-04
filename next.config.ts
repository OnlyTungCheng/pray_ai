import type { NextConfig } from 'next';

const STATIC_ASSET_CACHE_CONTROL = 'public, max-age=31536000, immutable';

const nextConfig: NextConfig = {
  // next/image serves local <Image> assets through its optimizer. The images in
  // public/ are versioned, so they can safely stay in the browser/CDN cache.
  images: {
    minimumCacheTTL: 31_536_000,
  },
  async headers() {
    return [
      {
        source: '/:path*(png|jpg|jpeg|gif|svg|webp|avif|mp3)',
        headers: [
          {
            key: 'Cache-Control',
            value: STATIC_ASSET_CACHE_CONTROL,
          },
        ],
      },
    ];
  },
};

export default nextConfig;
