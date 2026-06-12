import { describe, expect, it } from 'vitest';
import { isSafeInternalLink } from '@/lib/links';

describe('isSafeInternalLink', () => {
  it('내부 경로는 허용한다', () => {
    expect(isSafeInternalLink('/')).toBe(true);
    expect(isSafeInternalLink('/visits')).toBe(true);
    expect(isSafeInternalLink('/admin/approvals?tab=pending')).toBe(true);
  });

  it('외부 URL과 스킴이 있는 링크는 거부한다', () => {
    expect(isSafeInternalLink('https://evil.com')).toBe(false);
    expect(isSafeInternalLink('http://evil.com/')).toBe(false);
    expect(isSafeInternalLink('javascript:alert(1)')).toBe(false);
    expect(isSafeInternalLink('data:text/html,<script>')).toBe(false);
  });

  it('프로토콜 상대 URL(//host)은 거부한다', () => {
    expect(isSafeInternalLink('//evil.com')).toBe(false);
    expect(isSafeInternalLink('//evil.com/visits')).toBe(false);
  });

  it('빈 문자열과 상대 경로는 거부한다', () => {
    expect(isSafeInternalLink('')).toBe(false);
    expect(isSafeInternalLink('visits')).toBe(false);
    expect(isSafeInternalLink('../etc')).toBe(false);
  });
});
