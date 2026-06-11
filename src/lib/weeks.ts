import { addWeeks, format, startOfWeek } from 'date-fns';

/** 기준일이 속한 주의 일요일(주일)을 YYYY-MM-DD로 반환한다. offset 주 단위 이동 가능. */
export function sundayOf(base: Date, offsetWeeks = 0): string {
  const sunday = startOfWeek(addWeeks(base, offsetWeeks), { weekStartsOn: 0 });
  return format(sunday, 'yyyy-MM-dd');
}
