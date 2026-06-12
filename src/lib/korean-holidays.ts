import Holidays from 'date-holidays';

export interface KoreanHoliday {
  id: string;
  date: string;
  title: string;
}

interface HolidayLike {
  date: string;
  name: string;
  type: string;
}

const koreanHolidays = new Holidays('KR');

export function getKoreanHolidaysInRange(from: string, to: string): KoreanHoliday[] {
  const fromDate = toDateOnly(from);
  const toDate = toDateOnly(to);
  const years = yearsBetween(fromDate, toDate);

  return years
    .flatMap((year) => koreanHolidays.getHolidays(year) as HolidayLike[])
    .filter((holiday) => holiday.type === 'public')
    .map((holiday) => ({
      id: `holiday-${toDateOnly(holiday.date)}`,
      date: toDateOnly(holiday.date),
      title: holiday.name,
    }))
    .filter((holiday) => holiday.date >= fromDate && holiday.date <= toDate)
    .sort((a, b) => a.date.localeCompare(b.date));
}

export function getKoreanHolidayMap(holidays: KoreanHoliday[]): Map<string, KoreanHoliday> {
  return new Map(holidays.map((holiday) => [holiday.date, holiday]));
}

function toDateOnly(value: string): string {
  return value.slice(0, 10);
}

function yearsBetween(fromDate: string, toDate: string): number[] {
  const fromYear = Number.parseInt(fromDate.slice(0, 4), 10);
  const toYear = Number.parseInt(toDate.slice(0, 4), 10);
  const years: number[] = [];
  for (let year = fromYear; year <= toYear; year += 1) {
    years.push(year);
  }
  return years;
}
