import type { Metadata, Viewport } from 'next';
import './globals.css';

// iOS PWA 콜드 스타트 시 보여줄 Apple 스플래시 이미지 목록
// public/startup 의 PNG 는 아이콘을 화이트 배경에 중앙 정렬한 것 (gen 스크립트로 생성)
const appleStartupImages = [
  { w: 320, h: 568, r: 2, file: '640x1136' },
  { w: 375, h: 667, r: 2, file: '750x1334' },
  { w: 414, h: 736, r: 3, file: '1242x2208' },
  { w: 375, h: 812, r: 3, file: '1125x2436' },
  { w: 414, h: 896, r: 2, file: '828x1792' },
  { w: 414, h: 896, r: 3, file: '1242x2688' },
  { w: 390, h: 844, r: 3, file: '1170x2532' },
  { w: 428, h: 926, r: 3, file: '1284x2778' },
  { w: 393, h: 852, r: 3, file: '1179x2556' },
  { w: 430, h: 932, r: 3, file: '1290x2796' },
  { w: 402, h: 874, r: 3, file: '1206x2622' },
  { w: 440, h: 956, r: 3, file: '1320x2868' },
].map(({ w, h, r, file }) => ({
  url: `/startup/apple-splash-${file}.png`,
  media: `(device-width: ${w}px) and (device-height: ${h}px) and (-webkit-device-pixel-ratio: ${r}) and (orientation: portrait)`,
}));

export const metadata: Metadata = {
  title: '다드림 — 제자광성교회 청년부',
  description: '제자광성교회 청년부 다드림 대시보드',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: '다드림',
    startupImage: appleStartupImages,
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
    <html lang="ko" className="h-full antialiased" style={{ background: '#ffffff' }}>
      <body className="min-h-full flex flex-col" style={{ background: '#ffffff' }}>
        {children}
      </body>
    </html>
  );
}
