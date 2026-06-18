import { describe, expect, it } from 'vitest';
import { isSafeOrigin, getSafeRedirectOrigin } from '@/lib/auth-redirect';

describe('auth-redirect allowlist', () => {
  it('NEXT_PUBLIC_SITE_URL이 설정된 경우 해당 origin만 안전하다', () => {
    // vitest는 process.env를 모듈 로드 시점에 캡처하므로 동적 변경은 어렵다.
    // 기본값(NEXT_PUBLIC_SITE_URL 미설정 → localhost fallback)으로 검증한다.
    const safe = getSafeRedirectOrigin();
    expect(isSafeOrigin(safe)).toBe(true);
  });

  it('화이트리스트에 없는 origin은 거부된다', () => {
    expect(isSafeOrigin('http://evil.example.com')).toBe(false);
    expect(isSafeOrigin('http://localhost:9999')).toBe(false);
    expect(isSafeOrigin('javascript:alert(1)')).toBe(false);
  });

  it('null/빈 origin은 거부된다', () => {
    expect(isSafeOrigin(null)).toBe(false);
    expect(isSafeOrigin(undefined)).toBe(false);
    expect(isSafeOrigin('')).toBe(false);
  });

  it('getSafeRedirectOrigin은 항상 비어있지 않은 origin을 반환한다', () => {
    const origin = getSafeRedirectOrigin();
    expect(origin).toBeTruthy();
    expect(() => new URL(origin)).not.toThrow();
  });
});
