import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: '다드림 — 제자광성교회 청년부',
    short_name: '다드림',
    description: '제자광성교회 청년부 다드림 대시보드',
    // 홈화면 PWA 콜드 스타트 때 보호 대시보드 렌더링을 기다리느라 검은 화면이 길어지지 않도록
    // 먼저 아주 가벼운 공개 launch 화면을 페인트한 뒤 앱 내부에서 `/`로 이동한다.
    start_url: '/launch',
    display: 'standalone',
    lang: 'ko',
    // 콜드 스타트 시 OS 스플래시가 검게 보이지 않도록 앱 배경과 동일한 화이트로 맞춘다
    background_color: '#ffffff',
    theme_color: '#ffffff',
    icons: [
      { src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png' },
      { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png' },
      { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
    ],
  };
}
