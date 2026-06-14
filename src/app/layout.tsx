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
        {/*
          콜드 스타트 초기 페인트용 브랜드 폴백.
          서버 HTML 에 그대로 포함되어 JS/CSS 로딩 전에도 다드림 로고가 보인다.
          높은 z-index 로 가장 먼저 로고를 보여주고, 아래 inline script 가 load 이후 제거한다.
          pointer-events 가 없어 클릭을 가로채지 않는다.
          인라인 스타일을 사용해 globals.css 로드 전에도 정상적으로 보이게 한다.
        */}
        <div
          id="dadream-initial-loading"
          aria-hidden="true"
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 2147483000,
            pointerEvents: 'none',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '16px',
            background: '#ffffff',
          }}
        >
          {/* next/image 가 아닌 일반 img: raw HTML 에 그대로 노출되어 가장 빨리 그려진다 */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/icons/icon-512.png"
            alt=""
            width={96}
            height={96}
            className="dadream-loading-logo"
            style={{ width: 96, height: 96, borderRadius: 24 }}
          />
          <p style={{ fontSize: 14, color: '#6b7280', margin: 0 }}>다드림 불러오는 중...</p>
        </div>
        {children}
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){var until=Date.now()+5000;function hide(){var el=document.getElementById('dadream-initial-loading');if(!el)return;if(el.dataset.hiding==='true')return;el.dataset.hiding='true';el.style.opacity='0';el.style.transition='opacity 180ms ease';setTimeout(function(){var current=document.getElementById('dadream-initial-loading');if(current&&current.dataset.hiding==='true')current.remove();},220);}if(document.readyState==='complete'){setTimeout(hide,120);}else{window.addEventListener('load',function(){setTimeout(hide,120);},{once:true});}var timer=setInterval(function(){hide();if(Date.now()>until)clearInterval(timer);},500);setTimeout(function(){hide();clearInterval(timer);},5000);})();`,
          }}
        />
      </body>
    </html>
  );
}
