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
    <html lang="en">
      <head>
        <link rel="preload" as="image" href="/wavy.svg" />
        <link rel="preload" as="image" href="/talisman.svg" />
        <link rel="stylesheet" href="/css1.css" />
        <link rel="stylesheet" href="/css2.css" />
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
