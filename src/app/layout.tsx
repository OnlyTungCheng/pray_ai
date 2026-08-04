import type { Metadata, Viewport } from 'next';
import { Spectral, Be_Vietnam_Pro, JetBrains_Mono } from 'next/font/google';
import { Toaster } from 'sonner';
import './globals.css';

const spectral = Spectral({
  subsets: ['vietnamese', 'latin'],
  weight: ['400', '700'],
  variable: '--font-display',
});

const beVietnamPro = Be_Vietnam_Pro({
  subsets: ['vietnamese', 'latin'],
  weight: ['300', '400', '500', '600', '700', '800', '900'],
  variable: '--font-ui',
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  weight: ['400', '700'],
  variable: '--font-code',
});

export const metadata: Metadata = {
  title: 'Đền Cầu Nguyện - Deploy Bình An, Production Vô Sự',
  description: 'Nơi lập đền thắp nhang, gõ chuông cầu nguyện trước giờ deploy, build, database migration cho anh em developer.',
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_SITE_URL ??
      (process.env.VERCEL_PROJECT_PRODUCTION_URL
        ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
        : process.env.VERCEL_URL
          ? `https://${process.env.VERCEL_URL}`
          : 'http://localhost:3000')
  ),
  alternates: {
    canonical: '/'
  },
  openGraph: {
    type: 'website',
    locale: 'vi_VN',
    url: '/',
    siteName: 'Đền Cầu Nguyện',
    title: 'Đền Cầu Nguyện - Deploy Bình An, Production Vô Sự',
    description: 'Nơi lập đền thắp nhang, gõ chuông cầu nguyện trước giờ deploy, build, database migration cho anh em developer.',
    images: [
      {
        url: '/temple-og-preview-v1.png',
        width: 1200,
        height: 630,
        alt: 'Đền Cầu Nguyện — Deploy Bình An, Production Vô Sự'
      }
    ]
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Đền Cầu Nguyện - Deploy Bình An, Production Vô Sự',
    description: 'Nơi lập đền thắp nhang, gõ chuông cầu nguyện trước giờ deploy, build, database migration cho anh em developer.',
    images: ['/temple-og-preview-v1.png']
  },
  icons: {
    icon: '/favicon.svg'
  }
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#555555'
};

type RootLayoutProps = Readonly<{
  children: React.ReactNode;
}>;

export default function RootLayout({ children }: RootLayoutProps) {
  return (
    <html lang="vi">
      <head>
        <link rel="stylesheet" href="/css1.css" />
      </head>
      <body className={`${spectral.variable} ${beVietnamPro.variable} ${jetbrainsMono.variable} font-ui bg-[#111] text-stone-200 text-base selection:bg-amber-800 selection:text-white`}>
        {children}
        <Toaster
          theme="dark"
          position="bottom-right"
          richColors
          toastOptions={{
            style: {
              background: '#1c1c1c',
              border: '1px solid #444',
              color: '#e7e5e4'
            }
          }}
        />
      </body>
    </html>
  );
}
