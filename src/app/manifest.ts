import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: '다드림 — 제자광성교회 청년부',
    short_name: '다드림',
    description: '제자광성교회 청년부 다드림 대시보드',
    start_url: '/',
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
