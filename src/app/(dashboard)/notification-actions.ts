'use server';

import { revalidatePath } from 'next/cache';
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

  revalidatePath('/', 'layout');
  return {};
}
