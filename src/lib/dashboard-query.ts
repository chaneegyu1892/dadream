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

export interface CellSummaryInput {
  id: string;
  name: string;
  sort_order: number;
}

export interface CellMemberSummaryInput {
  id: string;
  name: string;
  cell_id: string | null;
  cell_role?: string | null;
  duty: string | null;
}

export interface CellSummary {
  id: string | null;
  name: string;
  sortOrder: number;
  memberCount: number;
  leaderNames: string[];
  memberNames: string[];
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

export function buildCellSummaries(
  cells: CellSummaryInput[],
  members: CellMemberSummaryInput[],
): CellSummary[] {
  const summaries = new Map<string | null, CellSummary>();

  summaries.set(null, {
    id: null,
    name: '무소속',
    sortOrder: -1,
    memberCount: 0,
    leaderNames: [],
    memberNames: [],
  });

  for (const cell of [...cells].sort(compareCells)) {
    summaries.set(cell.id, {
      id: cell.id,
      name: cell.name,
      sortOrder: cell.sort_order,
      memberCount: 0,
      leaderNames: [],
      memberNames: [],
    });
  }

  for (const member of members) {
    const summary = summaries.get(member.cell_id) ?? summaries.get(null);
    if (!summary) continue;

    summary.memberCount += 1;
    if (isCellLeader(member)) {
      summary.leaderNames.push(member.name);
    } else {
      summary.memberNames.push(member.name);
    }
  }

  return Array.from(summaries.values());
}

function compareCells(a: CellSummaryInput, b: CellSummaryInput): number {
  if (a.sort_order !== b.sort_order) return a.sort_order - b.sort_order;
  return a.name.localeCompare(b.name, 'ko-KR', { numeric: true });
}

/** 셀리더 판별: 새 cell_role을 우선 쓰고, 없으면 레거시 duty로 폴백한다. */
function isCellLeader(member: CellMemberSummaryInput): boolean {
  if (member.cell_role === '셀리더') return true;
  return isCellLeaderDuty(member.duty);
}

function isCellLeaderDuty(duty: string | null | undefined): boolean {
  if (!duty) return false;
  return /셀\s*리더|셀장|목자/.test(duty);
}

export function getCurrentMonthWindow(now = new Date()): DateWindow {
  const kstNow = toKstDateParts(now);
  const monthStart = new Date(Date.UTC(kstNow.year, kstNow.month - 2, 1));
  const monthEnd = new Date(Date.UTC(kstNow.year, kstNow.month + 1, 0));

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
