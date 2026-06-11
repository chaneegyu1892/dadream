import { describe, expect, it } from 'vitest';
import { sundayOf } from '@/lib/weeks';

describe('sundayOf', () => {
  it('해당 주의 일요일(주의 시작)을 반환한다', () => {
    expect(sundayOf(new Date('2026-06-11'))).toBe('2026-06-07'); // 목요일 → 그 주 일요일
    expect(sundayOf(new Date('2026-06-07'))).toBe('2026-06-07'); // 일요일 그대로
    expect(sundayOf(new Date('2026-06-13'))).toBe('2026-06-07'); // 토요일 → 같은 주
  });

  it('offset 주만큼 이동한다', () => {
    expect(sundayOf(new Date('2026-06-11'), 1)).toBe('2026-06-14'); // 다음 주일
    expect(sundayOf(new Date('2026-06-11'), -1)).toBe('2026-05-31');
  });
});
