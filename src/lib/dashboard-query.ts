const KST_OFFSET = '+09:00';
const KST_OFFSET_MINUTES = 9 * 60;

type SearchParamValue = string | string[] | undefined;

export interface MemberQueryState {
  query: string;
  cellId: string;
  page: number;
}

export interface PageRange {
  from: number;
  to: number;
}

export interface DateWindow {
  from: string;
  to: string;
}

function firstParam(value: SearchParamValue): string | undefined {
  if (Array.isArray(value)) return value[0];
  return value;
}

export function parsePositivePage(value: SearchParamValue): number {
  const raw = firstParam(value);
  const page = raw ? Number.parseInt(raw, 10) : 1;
  return Number.isFinite(page) && page > 0 ? page : 1;
}

export function getPageRange(page: number, pageSize: number): PageRange {
  const safePage = Math.max(1, page);
  const safePageSize = Math.max(1, pageSize);
  const from = (safePage - 1) * safePageSize;
  return { from, to: from + safePageSize - 1 };
}

export function parseMemberSearchParams(searchParams: Record<string, SearchParamValue>): MemberQueryState {
  const query = (firstParam(searchParams.q) ?? '').trim();
  const cellId = (firstParam(searchParams.cell) ?? 'all').trim() || 'all';
  return {
    query,
    cellId,
    page: parsePositivePage(searchParams.page),
  };
}

export function getCurrentMonthWindow(now = new Date()): DateWindow {
  const kstNow = toKstDateParts(now);
  const monthStart = new Date(Date.UTC(kstNow.year, kstNow.month - 1, 1));
  const monthEnd = new Date(Date.UTC(kstNow.year, kstNow.month, 0));

  // A small buffer keeps the initially visible calendar grid complete while
  // avoiding an unbounded events/visits scan.
  monthStart.setUTCDate(monthStart.getUTCDate() - 7);
  monthEnd.setUTCDate(monthEnd.getUTCDate() + 5);

  return {
    from: formatKstDateTime(monthStart, false),
    to: formatKstDateTime(monthEnd, true),
  };
}

function toKstDateParts(date: Date): { year: number; month: number } {
  const kstTime = date.getTime() + KST_OFFSET_MINUTES * 60 * 1000;
  const kstDate = new Date(kstTime);
  return {
    year: kstDate.getUTCFullYear(),
    month: kstDate.getUTCMonth() + 1,
  };
}

function formatKstDateTime(dateAtKstMidnight: Date, endOfDay: boolean): string {
  const year = dateAtKstMidnight.getUTCFullYear();
  const month = String(dateAtKstMidnight.getUTCMonth() + 1).padStart(2, '0');
  const day = String(dateAtKstMidnight.getUTCDate()).padStart(2, '0');
  const time = endOfDay ? '23:59:59.999' : '00:00:00.000';
  return `${year}-${month}-${day}T${time}${KST_OFFSET}`;
}
