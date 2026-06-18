import Link from 'next/link';
import { getSessionProfile } from '@/lib/auth';
import {
  getCachedCells,
  getCachedMembersOverview,
  getDashboardAccessToken,
} from '@/lib/dashboard-data-cache';
import { buildCellSummaries, getPageRange, parseMemberSearchParams } from '@/lib/dashboard-query';
import { roleAtLeast } from '@/lib/roles';
import { getSignedPhotoUrls } from '@/lib/photos';
import { createClient } from '@/lib/supabase/server';
import { CellOverviewGrid } from '@/components/cell-overview-grid';
import { MemberGrid } from '@/components/member-grid';
import { MemberSearchForm } from '@/components/member-search-form';
import { Button } from '@/components/ui/button';
import type { CellRow, MemberRow } from '@/types/db';

const MEMBERS_PAGE_SIZE = 48;

type MemberSummaryRow = Pick<MemberRow, 'id' | 'name' | 'cell_id' | 'cell_role' | 'duty'>;

interface MembersPageProps {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}

export default async function MembersPage({ searchParams }: MembersPageProps) {
  const session = await getSessionProfile();
  const { query, cellId, page } = parseMemberSearchParams((await searchParams) ?? {});
  const showingCellOverview = !query && cellId === 'all';
  const canManage = session ? roleAtLeast(session.role, 'officer') : false;
  // 캐시 헬퍼는 현재 요청의 access token이 필요하다. 토큰이 없으면 라이브 조회로 폴백한다.
  const accessToken = session ? await getDashboardAccessToken() : null;

  if (showingCellOverview) {
    let cells: CellRow[];
    let members: MemberSummaryRow[];
    const fetchOverviewLive = async () => {
      const supabase = await createClient();
      const [cellsRes, membersRes] = await Promise.all([
        supabase.from('cells').select('id, name, sort_order').order('sort_order'),
        supabase
          .from('members')
          .select('id, name, cell_id, cell_role, duty')
          .eq('active', true)
          .order('name'),
      ]);
      return {
        cells: (cellsRes.data ?? []) as CellRow[],
        members: (membersRes.data ?? []) as MemberSummaryRow[],
      };
    };

    if (session && accessToken) {
      const overview = await getCachedMembersOverview(session.userId, session.role, accessToken).catch((error) => {
        console.error('[MembersPage] cached overview 조회 실패, live 조회로 폴백:', error);
        return fetchOverviewLive();
      });
      cells = overview.cells;
      members = overview.members;
    } else {
      const overview = await fetchOverviewLive();
      cells = overview.cells;
      members = overview.members;
    }

    const summaries = buildCellSummaries(cells, members);
    const totalCount = summaries.reduce((sum, cell) => sum + cell.memberCount, 0);

    return (
      <div className="mx-auto max-w-6xl space-y-5">
        <MembersHeader totalCount={totalCount} canManage={canManage} />
        <MemberSearchForm
          cells={cells.map((c) => ({ id: c.id, name: c.name }))}
          query=""
          cellId="all"
          hint="이름으로 검색하거나 셀을 선택하면 서버에서 바로 찾아 사진을 불러와요."
        />
        <CellOverviewGrid cells={summaries} />
      </div>
    );
  }

  const { from, to } = getPageRange(page, MEMBERS_PAGE_SIZE);
  const supabase = await createClient();

  let membersQuery = supabase
    .from('members')
    .select('id, name, photo_path, cell_id, duty, is_officer, active', { count: 'exact' })
    .eq('active', true)
    .order('name')
    .range(from, to);

  if (query) {
    membersQuery = membersQuery.ilike('name', `%${query}%`);
  }
  if (cellId === 'unassigned') {
    membersQuery = membersQuery.is('cell_id', null);
  } else if (cellId !== 'all') {
    membersQuery = membersQuery.eq('cell_id', cellId);
  }

  // 실제 필터된 멤버 목록은 라이브로 조회하고, 거의 안 바뀌는 셀 드롭다운만 캐시를 쓴다.
  const [membersRes, cells] = await Promise.all([
    membersQuery,
    session && accessToken
      ? getCachedCells(session.userId, session.role, accessToken).catch((error) => {
          console.error('[MembersPage] cached cells 조회 실패, live 조회로 폴백:', error);
          return supabase
            .from('cells')
            .select('id, name, sort_order')
            .order('sort_order')
            .then((res) => (res.data ?? []) as CellRow[]);
        })
      : supabase
          .from('cells')
          .select('id, name, sort_order')
          .order('sort_order')
          .then((res) => (res.data ?? []) as CellRow[]),
  ]);

  const members = (membersRes.data ?? []) as MemberRow[];
  const totalCount = membersRes.count ?? members.length;
  const photoUrls = await getSignedPhotoUrls(
    members.map((m) => m.photo_path).filter((p): p is string => Boolean(p)),
  );
  const cellNames = new Map(cells.map((c) => [c.id, c.name]));

  return (
    <div className="mx-auto max-w-5xl space-y-5">
      <MembersHeader totalCount={totalCount} canManage={canManage} />

      <MemberGrid
        members={members.map((m) => ({
          id: m.id,
          name: m.name,
          photoUrl: m.photo_path ? (photoUrls.get(m.photo_path) ?? null) : null,
          cellId: m.cell_id,
          cellName: m.cell_id ? (cellNames.get(m.cell_id) ?? null) : null,
          duty: m.duty,
          isOfficer: m.is_officer,
        }))}
        cells={cells.map((c) => ({ id: c.id, name: c.name }))}
        query={query}
        cellId={cellId}
        page={page}
        pageSize={MEMBERS_PAGE_SIZE}
        totalCount={totalCount}
      />
    </div>
  );
}

function MembersHeader({ totalCount, canManage }: { totalCount: number; canManage: boolean }) {
  return (
    <header className="flex items-center justify-between">
      <div>
        <h1 className="text-2xl font-bold">청년 명부</h1>
        <p className="mt-1 text-sm text-muted-foreground">총 {totalCount}명</p>
      </div>
      {canManage && (
        <Button asChild size="sm">
          <Link href="/members/new">청년 추가</Link>
        </Button>
      )}
    </header>
  );
}
