import { describe, expect, it } from 'vitest';
import { getKoreanHolidaysInRange, getKoreanHolidayMap } from '@/lib/korean-holidays';

describe('getKoreanHolidaysInRange', () => {
  it('대한민국 공휴일을 지정한 날짜 범위 안에서 ISO 날짜로 반환한다', () => {
    const holidays = getKoreanHolidaysInRange('2026-01-01T00:00:00.000+09:00', '2026-01-31T23:59:59.999+09:00');

    expect(holidays).toContainEqual({
      id: 'holiday-2026-01-01',
      date: '2026-01-01',
      title: '신정',
    });
  });

  it('범위 밖 공휴일은 제외한다', () => {
    const holidays = getKoreanHolidaysInRange('2026-12-01T00:00:00.000+09:00', '2026-12-31T23:59:59.999+09:00');

    expect(holidays).toContainEqual({
      id: 'holiday-2026-12-25',
      date: '2026-12-25',
      title: '기독탄신일',
    });
    expect(holidays.some((holiday) => holiday.date === '2026-01-01')).toBe(false);
  });
});

describe('getKoreanHolidayMap', () => {
  it('캘린더 날짜 매칭용 Map을 만든다', () => {
    const map = getKoreanHolidayMap([
      { id: 'holiday-2026-01-01', date: '2026-01-01', title: '새해 첫날' },
    ]);

    expect(map.get('2026-01-01')?.title).toBe('새해 첫날');
    expect(map.get('2026-01-02')).toBeUndefined();
  });
});
