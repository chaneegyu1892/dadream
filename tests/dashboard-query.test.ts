import { describe, expect, it, vi } from 'vitest';
import {
  getCurrentMonthWindow,
  getPageRange,
  parseMemberSearchParams,
  parsePositivePage,
} from '@/lib/dashboard-query';

describe('parsePositivePage', () => {
  it('1보다 작은 값이나 숫자가 아닌 값은 1페이지로 보정한다', () => {
    expect(parsePositivePage(undefined)).toBe(1);
    expect(parsePositivePage('abc')).toBe(1);
    expect(parsePositivePage('0')).toBe(1);
    expect(parsePositivePage('-4')).toBe(1);
  });

  it('양수 문자열은 정수 페이지로 변환한다', () => {
    expect(parsePositivePage('3')).toBe(3);
    expect(parsePositivePage(['5', '6'])).toBe(5);
  });
});

describe('getPageRange', () => {
  it('Supabase range에 사용할 from/to 오프셋을 계산한다', () => {
    expect(getPageRange(1, 48)).toEqual({ from: 0, to: 47 });
    expect(getPageRange(3, 48)).toEqual({ from: 96, to: 143 });
  });
});

describe('parseMemberSearchParams', () => {
  it('검색어/셀/page 값을 안전하게 정규화한다', () => {
    expect(
      parseMemberSearchParams({ q: '  김  ', cell: 'cell-1', page: '2' }),
    ).toEqual({ query: '김', cellId: 'cell-1', page: 2 });
  });

  it('전체 셀 필터와 빈 검색어는 쿼리 조건에서 제외한다', () => {
    expect(parseMemberSearchParams({ q: ' ', cell: 'all', page: 'x' })).toEqual({
      query: '',
      cellId: 'all',
      page: 1,
    });
  });
});

describe('getCurrentMonthWindow', () => {
  it('캘린더 초기 월 주변 일정만 가져오도록 전월 말~익월 초 범위를 만든다', () => {
    vi.setSystemTime(new Date('2026-06-15T12:00:00+09:00'));

    expect(getCurrentMonthWindow()).toEqual({
      from: '2026-05-25T00:00:00.000+09:00',
      to: '2026-07-05T23:59:59.999+09:00',
    });
  });
});
