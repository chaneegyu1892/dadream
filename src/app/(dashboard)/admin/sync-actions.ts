'use server';

import { revalidatePath } from 'next/cache';
import { getSessionProfile } from '@/lib/auth';
import {
  revalidateCalendarCaches,
  revalidateHomeEventCaches,
  revalidateHomeServiceCaches,
  revalidateMemberCaches,
} from '@/lib/dashboard-cache-invalidation';
import { roleAtLeast } from '@/lib/roles';

export type SyncDashboardDataResult = {
  ok: boolean;
  message: string;
};

/**
 * DB 데이터를 바꾸지 않고, 명부/캘린더 서버 쿼리 캐시를 stale 처리한다.
 * 실제 화면 새로고침은 클라이언트에서 router.refresh()로 수행한다.
 */
export async function syncDashboardData(): Promise<SyncDashboardDataResult> {
  const session = await getSessionProfile();

  if (!session || session.approval !== 'approved' || !roleAtLeast(session.role, 'officer')) {
    return { ok: false, message: '동기화 권한이 없어요.' };
  }

  revalidateMemberCaches();
  revalidateCalendarCaches();
  revalidateHomeEventCaches();
  revalidateHomeServiceCaches();
  revalidatePath('/', 'layout');
  revalidatePath('/members');
  revalidatePath('/visits');

  return {
    ok: true,
    message: '데이터 동기화를 요청했어요. 화면을 최신 데이터로 다시 불러와요.',
  };
}
