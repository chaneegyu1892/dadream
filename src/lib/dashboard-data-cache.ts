import { unstable_cache } from 'next/cache';
import { createClient as createSupabaseClient } from '@supabase/supabase-js';
import {
  CALENDAR_CACHE_SECONDS,
  DASHBOARD_CACHE_TAGS,
  HOME_EVENTS_CACHE_SECONDS,
  HOME_SERVICE_CACHE_SECONDS,
  STABLE_CACHE_SECONDS,
} from '@/lib/dashboard-cache-tags';
import type { DateWindow } from '@/lib/dashboard-query';
import { getSupabaseEnv } from '@/lib/supabase/env';
import { createClient as createServerClient } from '@/lib/supabase/server';
import type { CellRow, EventRow, MemberRow, VisitRow } from '@/types/db';
import type { Database } from '@/types/supabase';

export { DASHBOARD_CACHE_TAGS } from '@/lib/dashboard-cache-tags';

export type MemberSummaryRow = Pick<MemberRow, 'id' | 'name' | 'cell_id' | 'cell_role' | 'duty'>;
export type CalendarVisitRow = Pick<VisitRow, 'id' | 'confirmed_at'> & {
  members: { name: string } | null;
};

export interface MembersOverviewData {
  cells: CellRow[];
  members: MemberSummaryRow[];
}

export interface CalendarDisplayData {
  events: EventRow[];
  visits: CalendarVisitRow[];
}

/** 홈 "예배위원" 카드용 배정 요약 행(이번 주/다음 주 주일). */
export type HomeServiceRow = {
  id: string;
  service_date: string;
  service_roles: { name: string; sort_order: number } | null;
  members: { name: string } | null;
};

/**
 * 현재 요청의 access token으로 인증된 supabase-js 클라이언트를 만든다.
 * ssr 서버 클라이언트와 달리 `cookies()`를 읽지 않으므로 `unstable_cache` 안에서 안전하다.
 * Authorization 헤더로 사용자 토큰을 넘겨 RLS를 그대로 적용한다.
 */
function createAuthedClient(accessToken: string) {
  const { url, anonKey } = getSupabaseEnv();
  return createSupabaseClient<Database>(url, anonKey, {
    global: { headers: { Authorization: `Bearer ${accessToken}` } },
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

/**
 * 현재 로그인 세션의 access token을 가져온다. ssr 클라이언트(쿠키 사용)는 캐시 바깥에서만 호출하므로
 * 캐시 함수 내부에서 `cookies()`를 읽지 않는다. 토큰은 캐시 미스 때만 쓰이는 클로저 변수로 전달된다.
 */
export async function getDashboardAccessToken(): Promise<string | null> {
  const supabase = await createServerClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();
  return session?.access_token ?? null;
}

/**
 * `/members` 기본 개요용: 셀 목록 + 활동 청년 요약. 거의 안 바뀌므로 길게 캐시한다.
 * 사용자별(userId)로 캐시해 RLS 결과가 사용자 간에 섞이지 않게 한다. access token은 keyParts에서 제외.
 */
export function getCachedMembersOverview(
  userId: string,
  accessToken: string,
): Promise<MembersOverviewData> {
  return unstable_cache(
    async () => {
      const supabase = createAuthedClient(accessToken);
      const [cellsRes, membersRes] = await Promise.all([
        supabase.from('cells').select('id, name, sort_order').order('sort_order'),
        supabase
          .from('members')
          .select('id, name, cell_id, cell_role, duty')
          .eq('active', true)
          .order('name'),
      ]);

      if (cellsRes.error) throw new Error(`셀 목록 조회 실패: ${cellsRes.error.message}`);
      if (membersRes.error) throw new Error(`청년 요약 조회 실패: ${membersRes.error.message}`);

      return {
        cells: (cellsRes.data ?? []) as CellRow[],
        members: (membersRes.data ?? []) as MemberSummaryRow[],
      };
    },
    ['dashboard-members-overview', userId],
    { tags: [DASHBOARD_CACHE_TAGS.members], revalidate: STABLE_CACHE_SECONDS },
  )();
}

/**
 * 멤버 검색/필터 화면의 셀 드롭다운용 셀 목록. 길게 캐시한다.
 * (필터된 실제 멤버 목록은 캐시하지 않고 라이브로 조회한다.)
 */
export function getCachedCells(userId: string, accessToken: string): Promise<CellRow[]> {
  return unstable_cache(
    async () => {
      const supabase = createAuthedClient(accessToken);
      const { data, error } = await supabase
        .from('cells')
        .select('id, name, sort_order')
        .order('sort_order');

      if (error) throw new Error(`셀 목록 조회 실패: ${error.message}`);
      return (data ?? []) as CellRow[];
    },
    ['dashboard-cells', userId],
    { tags: [DASHBOARD_CACHE_TAGS.cells], revalidate: STABLE_CACHE_SECONDS },
  )();
}

/**
 * `/visits` 캘린더 표시용: 해당 월 범위의 일정 + 확정 심방 행. 짧게 캐시한다.
 * (진행 중/지난 심방 액션 목록은 캐시하지 않고 라이브로 조회한다.)
 * 월 범위(window)는 시간 의존적이므로 캐시 바깥에서 계산해 keyParts로 넘긴다.
 */
export function getCachedCalendarDisplay(
  userId: string,
  accessToken: string,
  window: DateWindow,
): Promise<CalendarDisplayData> {
  const { from, to } = window;
  return unstable_cache(
    async () => {
      const supabase = createAuthedClient(accessToken);
      const [eventsRes, visitsRes] = await Promise.all([
        supabase
          .from('events')
          .select('id, title, starts_at, ends_at, location, description, color')
          .gte('starts_at', from)
          .lte('starts_at', to)
          .order('starts_at')
          .limit(100),
        supabase
          .from('visit_requests')
          .select('id, confirmed_at, members(name)')
          .not('confirmed_at', 'is', null)
          .gte('confirmed_at', from)
          .lte('confirmed_at', to)
          .order('confirmed_at')
          .limit(100),
      ]);

      if (eventsRes.error) throw new Error(`일정 조회 실패: ${eventsRes.error.message}`);
      if (visitsRes.error) throw new Error(`확정 심방 조회 실패: ${visitsRes.error.message}`);

      return {
        events: (eventsRes.data ?? []) as EventRow[],
        visits: (visitsRes.data ?? []) as unknown as CalendarVisitRow[],
      };
    },
    ['dashboard-calendar', userId, from, to],
    { tags: [DASHBOARD_CACHE_TAGS.calendar], revalidate: CALENDAR_CACHE_SECONDS },
  )();
}

/**
 * 홈 "다가오는 일정(7일)" 카드용 일정 목록. 안정 윈도우(KST 오늘~+7일)를 keyParts로 받아 캐시한다.
 * 윈도우는 시간 의존적이므로 캐시 바깥에서 계산해 넘긴다. 일정 생성/수정 시 태그로 즉시 무효화된다.
 * UI에서 이미 지난 오늘 일정을 필터링한 뒤 5개만 보여주므로, 과거 일정이 앞쪽을 채워도
 * 이후 예정 일정이 사라지지 않게 넉넉히 가져온다.
 */
export function getCachedHomeEvents(
  userId: string,
  accessToken: string,
  window: DateWindow,
): Promise<EventRow[]> {
  const { from, to } = window;
  return unstable_cache(
    async () => {
      const supabase = createAuthedClient(accessToken);
      const { data, error } = await supabase
        .from('events')
        .select('id, title, starts_at, ends_at, location, description, color')
        .gte('starts_at', from)
        .lte('starts_at', to)
        .order('starts_at')
        .limit(100);

      if (error) throw new Error(`다가오는 일정 조회 실패: ${error.message}`);
      return (data ?? []) as EventRow[];
    },
    ['dashboard-home-events', userId, from, to],
    { tags: [DASHBOARD_CACHE_TAGS.homeEvents], revalidate: HOME_EVENTS_CACHE_SECONDS },
  )();
}

/**
 * 홈 "예배위원" 카드용 이번 주/다음 주 주일 배정. 주일 날짜(YYYY-MM-DD)는 시간 의존적이므로
 * 캐시 바깥에서 계산해 keyParts로 넘긴다. 배정 추가/삭제 시 태그로 즉시 무효화된다.
 */
export function getCachedHomeService(
  userId: string,
  accessToken: string,
  thisWeek: string,
  nextWeek: string,
): Promise<HomeServiceRow[]> {
  return unstable_cache(
    async () => {
      const supabase = createAuthedClient(accessToken);
      const { data, error } = await supabase
        .from('service_assignments')
        .select('id, service_date, service_roles(name, sort_order), members(name)')
        .in('service_date', [thisWeek, nextWeek]);

      if (error) throw new Error(`예배위원 배정 조회 실패: ${error.message}`);
      return (data ?? []) as unknown as HomeServiceRow[];
    },
    ['dashboard-home-service', userId, thisWeek, nextWeek],
    { tags: [DASHBOARD_CACHE_TAGS.homeService], revalidate: HOME_SERVICE_CACHE_SECONDS },
  )();
}
