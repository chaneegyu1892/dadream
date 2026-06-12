import { describe, expect, it } from 'vitest';
import { filterByQuery } from '@/lib/member-search';

const ITEMS = [
  { id: '1', name: '김철수', description: '1셀' },
  { id: '2', name: '이영희', description: '2셀' },
  { id: '3', name: '박철민', description: null },
  { id: '4', name: 'John', description: '3셀' },
];

describe('filterByQuery', () => {
  it('빈 검색어는 전체를 반환한다', () => {
    expect(filterByQuery(ITEMS, '')).toEqual(ITEMS);
    expect(filterByQuery(ITEMS, '   ')).toEqual(ITEMS);
  });

  it('이름 부분 일치로 필터링한다', () => {
    expect(filterByQuery(ITEMS, '철').map((m) => m.id)).toEqual(['1', '3']);
    expect(filterByQuery(ITEMS, '영희').map((m) => m.id)).toEqual(['2']);
  });

  it('보조 설명(셀 이름)으로도 검색된다', () => {
    expect(filterByQuery(ITEMS, '2셀').map((m) => m.id)).toEqual(['2']);
  });

  it('영문은 대소문자를 무시한다', () => {
    expect(filterByQuery(ITEMS, 'john').map((m) => m.id)).toEqual(['4']);
    expect(filterByQuery(ITEMS, 'JOHN').map((m) => m.id)).toEqual(['4']);
  });

  it('일치하는 항목이 없으면 빈 배열을 반환한다', () => {
    expect(filterByQuery(ITEMS, '없는이름')).toEqual([]);
  });

  it('원본 배열을 변경하지 않는다', () => {
    const before = [...ITEMS];
    filterByQuery(ITEMS, '철');
    expect(ITEMS).toEqual(before);
  });
});
