import { revalidateTag } from 'next/cache';
import { DASHBOARD_CACHE_TAGS } from '@/lib/dashboard-cache-tags';

/**
 * 명부/셀 관련 캐시를 즉시 만료한다.
 * `unstable_cache` 태그를 쓰므로 `revalidateTag`로 무효화한다.
 * `{ expire: 0 }`은 다음 요청에서 stale 값을 내보내지 않고 fresh 조회를 기다리게 한다.
 * 호출부의 기존 `revalidatePath`는 그대로 유지한다.
 */
export function revalidateMemberCaches(): void {
  revalidateTag(DASHBOARD_CACHE_TAGS.members, { expire: 0 });
  revalidateTag(DASHBOARD_CACHE_TAGS.cells, { expire: 0 });
}

/** 캘린더(일정 + 확정 심방) 캐시를 즉시 만료한다. */
export function revalidateCalendarCaches(): void {
  revalidateTag(DASHBOARD_CACHE_TAGS.calendar, { expire: 0 });
}

/** 홈 "다가오는 일정(7일)" 캐시를 즉시 만료한다. 일정이 바뀔 때 호출한다. */
export function revalidateHomeEventCaches(): void {
  revalidateTag(DASHBOARD_CACHE_TAGS.homeEvents, { expire: 0 });
}

/** 홈 "예배위원" 배정 캐시를 즉시 만료한다. 배정이 바뀔 때 호출한다. */
export function revalidateHomeServiceCaches(): void {
  revalidateTag(DASHBOARD_CACHE_TAGS.homeService, { expire: 0 });
}
