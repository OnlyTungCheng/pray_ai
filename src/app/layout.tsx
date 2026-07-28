import type { Metadata, Viewport } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: '來上香 · Come Offer Incense',
  description: '歡迎各位路人來這裡上香 · All passersby are invited to come and offer incense',
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
