import type { NextConfig } from 'next';

/**
 * 심층 방어용 보안 응답 헤더.
 * 청년부 명부에 사진·연락처·생일이 담기므로 클릭재킹·MIME 스니핑·정보 유출을 기본 차단한다.
 * CSP는 앱 동작(인라인 스타일/스크립트, Supabase fetch·websocket)을 깨지 않도록
 * 클릭재킹·base 변조·플러그인만 제한하는 보수적 구성으로 둔다.
 */
const securityHeaders = [
  { key: 'X-Frame-Options', value: 'DENY' },
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
  {
    key: 'Strict-Transport-Security',
    value: 'max-age=63072000; includeSubDomains; preload',
  },
  {
    key: 'Content-Security-Policy',
    value: ["frame-ancestors 'none'", "base-uri 'self'", "object-src 'none'"].join('; '),
  },
];

const nextConfig: NextConfig = {
  /**
   * 클라이언트 라우터 캐시 보존 시간(초).
   * 동적(인증) 라우트는 prefetch가 데이터까지 못 받아 탭을 옮길 때마다 서버를 왕복하고
   * loading 화면이 매번 떴다. dynamic 캐시를 30초 두면 최근 방문한 탭으로의 재이동은
   * 서버 왕복·로딩 화면 없이 즉시 전환된다(변경은 서버액션의 revalidate로 즉시 무효화됨).
   */
  experimental: {
    staleTimes: {
      dynamic: 30,
      static: 180,
    },
  },
  async headers() {
    return [
      {
        source: '/:path*',
        headers: securityHeaders,
      },
    ];
  },
};

export default nextConfig;
