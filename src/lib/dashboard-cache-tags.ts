/**
 * 대시보드 서버 쿼리 캐시 태그와 수명 상수.
 * 캐시 헬퍼(`dashboard-data-cache`)와 무효화 헬퍼(`dashboard-cache-invalidation`)가
 * 공유하며, next 런타임에 의존하지 않아 단위 테스트에서 그대로 import할 수 있다.
 */
export const DASHBOARD_CACHE_TAGS = {
  /** 명부 개요(셀 + 활동 청년 요약) */
  members: 'dashboard:members',
  /** 셀 목록(검색 폼/드롭다운) */
  cells: 'dashboard:cells',
  /** 캘린더 표시용 일정 + 확정 심방 */
  calendar: 'dashboard:calendar',
  /** 홈 화면 "다가오는 일정(7일)" */
  homeEvents: 'dashboard:home-events',
  /** 홈 화면 "예배위원"(이번 주/다음 주 배정) */
  homeService: 'dashboard:home-service',
} as const;

export type DashboardCacheTag = (typeof DASHBOARD_CACHE_TAGS)[keyof typeof DASHBOARD_CACHE_TAGS];

/** 명부/셀처럼 거의 바뀌지 않는 데이터는 길게 캐시한다. */
export const STABLE_CACHE_SECONDS = 12 * 60 * 60;
/** 캘린더는 심방 확정 등으로 더 자주 바뀌므로 짧게 캐시한다. */
export const CALENDAR_CACHE_SECONDS = 2 * 60 * 60;
/**
 * 홈 "다가오는 일정"은 일정 추가 시 태그 무효화로 즉시 갱신되지만,
 * 안전망으로 짧게(30분) 자동 만료해 누락 무효화에도 오래된 값이 남지 않게 한다.
 */
export const HOME_EVENTS_CACHE_SECONDS = 30 * 60;
/** 홈 "예배위원" 배정은 자주 바뀌지 않으므로 캘린더와 동일하게 2시간 캐시한다. */
export const HOME_SERVICE_CACHE_SECONDS = 2 * 60 * 60;
