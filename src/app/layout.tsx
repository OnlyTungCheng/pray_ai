import type { Metadata, Viewport } from 'next';
import './globals.css';

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
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link
          href="https://fonts.googleapis.com/css2?family=Ma+Shan+Zheng&family=Noto+Serif+TC:wght@400;700;900&family=Noto+Sans+TC:wght@300;400;500;700&display=swap"
          rel="stylesheet"
        />
        <link rel="stylesheet" href="/css1.css" />
        <link rel="stylesheet" href="/css2.css" />
      </head>
      <body className="bg-[#111] text-stone-200 text-base selection:bg-amber-800 selection:text-white">
        {children}
      </body>
    </html>
  );
}
