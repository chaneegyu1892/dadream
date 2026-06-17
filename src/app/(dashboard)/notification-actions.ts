'use server';

import { getSessionProfile } from '@/lib/auth';
import { createClient } from '@/lib/supabase/server';

export async function markAllNotificationsRead(): Promise<{ error?: string }> {
  const session = await getSessionProfile();
  if (!session) return { error: '로그인이 필요해요.' };

  const supabase = await createClient();
  const { error } = await supabase
    .from('notifications')
    .update({ read_at: new Date().toISOString() })
    .eq('profile_id', session.userId)
    .is('read_at', null);

  if (error) return { error: '읽음 처리에 실패했어요.' };

  // 읽음 상태는 클라이언트에서 즉시 반영하고, DB만 갱신한다.
  // 무거운 layout revalidate를 피해 종 클릭 반응을 빠르게 한다(다음 내비게이션에서 서버값 동기화).
  return {};
}
