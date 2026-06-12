import type { Metadata, Viewport } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: '다드림 — 제자광성교회 청년부',
  description: '제자광성교회 청년부 다드림 대시보드',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: '다드림',
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  // 노치/홈 인디케이터 영역까지 화면을 채우고 safe-area-inset으로 보정한다
  viewportFit: 'cover',
  themeColor: '#ffffff',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko" className="h-full antialiased">
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
