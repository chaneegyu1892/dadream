'use server';

import { refresh, revalidatePath } from 'next/cache';
import { getSessionProfile } from '@/lib/auth';
import { roleAtLeast } from '@/lib/roles';

const SYNC_PATHS = ['/', '/members', '/visits'] as const;

export type SyncDashboardDataResult = {
  ok: boolean;
  message: string;
};

/**
 * 핵심 대시보드 경로를 stale 처리하고 현재 브라우저의 라우터 캐시를 다시 불러오게 한다.
 * DB 데이터는 변경하지 않는다.
 */
export async function syncDashboardData(): Promise<SyncDashboardDataResult> {
  const session = await getSessionProfile();

  if (!session || session.approval !== 'approved' || !roleAtLeast(session.role, 'officer')) {
    return { ok: false, message: '동기화 권한이 없어요.' };
  }

  revalidatePath('/', 'layout');
  for (const path of SYNC_PATHS) {
    revalidatePath(path);
  }
  refresh();

  return {
    ok: true,
    message: '데이터 동기화를 요청했어요. 잠시 후 최신 화면으로 다시 불러와요.',
  };
}
