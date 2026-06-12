import { describe, expect, it } from 'vitest';
import {
  EVENT_COLOR_OPTIONS,
  eventColorSchema,
  normalizeEventColor,
  parseCalendarEventInput,
  toKstDateOnly,
  toKstDateTime,
} from '@/lib/events';

describe('eventColorSchema', () => {
  it('허용된 일정 색상만 통과시킨다', () => {
    expect(eventColorSchema.parse('sky')).toBe('sky');
    expect(eventColorSchema.safeParse('red').success).toBe(false);
    expect(EVENT_COLOR_OPTIONS.map((option) => option.value)).toEqual([
      'sky',
      'emerald',
      'amber',
      'violet',
      'pink',
    ]);
  });

  it('알 수 없는 색상은 기본 파랑으로 보정한다', () => {
    expect(normalizeEventColor('violet')).toBe('violet');
    expect(normalizeEventColor('red')).toBe('sky');
    expect(normalizeEventColor(null)).toBe('sky');
  });
});

describe('toKstDateTime', () => {
  it('날짜와 시간을 KST 오프셋이 있는 timestamptz 입력값으로 조합한다', () => {
    expect(toKstDateTime('2026-06-12', '09:30')).toBe('2026-06-12T09:30:00+09:00');
  });

  it('UTC 기준 전날이어도 KST 날짜를 반환한다', () => {
    expect(toKstDateOnly(new Date('2026-06-11T18:00:00.000Z'))).toBe('2026-06-12');
  });
});

describe('parseCalendarEventInput', () => {
  it('일정 생성 입력을 정리해서 DB insert용 값으로 변환한다', () => {
    expect(
      parseCalendarEventInput({
        title: '  임원 MT  ',
        date: '2026-06-12',
        startTime: '10:00',
        endTime: '12:30',
        location: '교육관',
        description: '  준비물 확인  ',
        color: 'emerald',
      }),
    ).toEqual({
      title: '임원 MT',
      startsAt: '2026-06-12T10:00:00+09:00',
      endsAt: '2026-06-12T12:30:00+09:00',
      location: '교육관',
      description: '준비물 확인',
      color: 'emerald',
    });
  });

  it('종료 시간이 시작 시간보다 빠르면 실패한다', () => {
    const result = parseCalendarEventInput({
      title: '잘못된 일정',
      date: '2026-06-12',
      startTime: '14:00',
      endTime: '13:59',
      location: '',
      description: '',
      color: 'sky',
    });

    expect(result).toEqual({ error: '종료 시간은 시작 시간보다 늦어야 해요.' });
  });

  it('잘못된 시간 형식은 실패한다', () => {
    expect(
      parseCalendarEventInput({
        title: '잘못된 시간',
        date: '2026-06-12',
        startTime: '99:99',
        endTime: '',
        location: '',
        description: '',
        color: 'sky',
      }),
    ).toEqual({ error: '시작 시간을 선택해주세요.' });
  });
});
