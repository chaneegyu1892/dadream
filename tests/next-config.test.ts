import { describe, expect, it } from 'vitest';
import nextConfig from '../next.config';

describe('next.config 보안 헤더', () => {
  async function headerMap() {
    const groups = await nextConfig.headers!();
    const all = groups.flatMap((g) => g.headers);
    return new Map(all.map((h) => [h.key, h.value]));
  }

  it('모든 경로에 보안 헤더를 적용한다', async () => {
    const groups = await nextConfig.headers!();
    expect(groups).toHaveLength(1);
    expect(groups[0].source).toBe('/:path*');
  });

  it('클릭재킹·MIME 스니핑을 차단한다', async () => {
    const headers = await headerMap();
    expect(headers.get('X-Frame-Options')).toBe('DENY');
    expect(headers.get('X-Content-Type-Options')).toBe('nosniff');
  });

  it('HSTS와 frame-ancestors 차단 CSP를 설정한다', async () => {
    const headers = await headerMap();
    expect(headers.get('Strict-Transport-Security')).toContain('max-age=');
    expect(headers.get('Content-Security-Policy')).toContain("frame-ancestors 'none'");
  });

  it('Referrer-Policy와 Permissions-Policy가 존재한다', async () => {
    const headers = await headerMap();
    expect(headers.get('Referrer-Policy')).toBeTruthy();
    expect(headers.get('Permissions-Policy')).toContain('geolocation=()');
  });
});

describe('next.config 클라이언트 캐시(staleTimes)', () => {
  it('동적·정적 라우터 캐시 보존 시간을 설정한다', () => {
    expect(nextConfig.experimental?.staleTimes).toEqual({
      dynamic: 30,
      static: 180,
    });
  });
});
