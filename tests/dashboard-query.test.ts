import { describe, expect, it, vi } from 'vitest';
import {
  buildCellSummaries,
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

  it('무소속 셀 필터를 보존한다', () => {
    expect(parseMemberSearchParams({ cell: 'unassigned' })).toEqual({
      query: '',
      cellId: 'unassigned',
      page: 1,
    });
  });
});

describe('buildCellSummaries', () => {
  const cells = [
    { id: 'cell-2', name: '2셀', sort_order: 2 },
    { id: 'cell-1', name: '1셀', sort_order: 1 },
  ];

  it('무소속을 먼저 두고 셀 sort_order 순서로 요약한다', () => {
    const summaries = buildCellSummaries(cells, [
      { id: 'm1', name: '김무소', cell_id: null, duty: null, is_officer: false },
      { id: 'm2', name: '이리더', cell_id: 'cell-1', duty: '셀리더', is_officer: true },
      { id: 'm3', name: '박멤버', cell_id: 'cell-1', duty: null, is_officer: false },
    ]);

    expect(summaries.map((s) => s.name)).toEqual(['무소속', '1셀', '2셀']);
    expect(summaries[0]).toMatchObject({ id: null, memberCount: 1, leaderNames: [] });
    expect(summaries[1]).toMatchObject({
      id: 'cell-1',
      memberCount: 2,
      officerCount: 1,
      leaderNames: ['이리더'],
    });
    expect(summaries[2]).toMatchObject({ id: 'cell-2', memberCount: 0 });
  });

  it('셀리더/셀장/목자 직분을 셀 리더로 인식한다', () => {
    const summaries = buildCellSummaries(cells.slice(0, 1), [
      { id: 'm1', name: '김셀장', cell_id: 'cell-2', duty: '셀장', is_officer: false },
      { id: 'm2', name: '이목자', cell_id: 'cell-2', duty: '청년부 목자', is_officer: false },
      { id: 'm3', name: '박팀장', cell_id: 'cell-2', duty: '찬양팀 리더', is_officer: false },
    ]);

    expect(summaries[1].leaderNames).toEqual(['김셀장', '이목자']);
  });
});

describe('getCurrentMonthWindow', () => {
  it('캘린더 앞뒤 이동을 위해 현재 달 기준 앞뒤 1개월 범위를 만든다', () => {
    vi.setSystemTime(new Date('2026-06-15T12:00:00+09:00'));

    expect(getCurrentMonthWindow()).toEqual({
      from: '2026-05-01T00:00:00.000+09:00',
      to: '2026-07-31T23:59:59.999+09:00',
    });
  });
});
