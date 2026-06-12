import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: '다드림 — 제자광성교회 청년부',
    short_name: '다드림',
    description: '제자광성교회 청년부 다드림 대시보드',
    start_url: '/',
    display: 'standalone',
    lang: 'ko',
    // 스플래시 화면은 로고와 같은 다크, 앱 UI 크롬은 화이트
    background_color: '#1c1a1b',
    theme_color: '#ffffff',
    icons: [
      { src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png' },
      { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png' },
      { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
    ],
  };
}
