'use server';

import { revalidatePath } from 'next/cache';
import { getSessionProfile } from '@/lib/auth';
import { parseSelfProfile } from '@/lib/self-profile';
import { createClient } from '@/lib/supabase/server';

/**
 * 로그인한 본인의 연락처/상세 정보를 저장한다.
 * member_id는 절대 클라이언트에서 받지 않고 세션에서만 도출한다.
 */
export async function updateSelfProfile(
  formData: FormData,
): Promise<{ error?: string; success?: true }> {
  const session = await getSessionProfile();
  if (!session || session.approval !== 'approved') {
    return { error: '승인된 계정만 정보를 수정할 수 있어요.' };
  }
  if (!session.memberId) {
    return { error: '명부 연결이 필요해요. 임원에게 문의해주세요.' };
  }

  const parsed = parseSelfProfile(formData);
  if (!parsed.success) {
    return { error: parsed.error };
  }

  const memberId = session.memberId;
  const now = new Date().toISOString();
  const supabase = await createClient();

  const { error: contactError } = await supabase
    .from('member_contact')
    .upsert({ member_id: memberId, ...parsed.data.contact, updated_at: now }, { onConflict: 'member_id' });
  if (contactError) {
    console.error('[updateSelfProfile] member_contact upsert 실패:', contactError.message);
    return { error: '연락처 정보를 저장하지 못했어요. 다시 시도해주세요.' };
  }

  const { error: privateError } = await supabase
    .from('member_private')
    .upsert({ member_id: memberId, ...parsed.data.private, updated_at: now }, { onConflict: 'member_id' });
  if (privateError) {
    console.error('[updateSelfProfile] member_private upsert 실패:', privateError.message);
    return { error: '상세 정보를 저장하지 못했어요. 다시 시도해주세요.' };
  }

  revalidatePath('/me');
  revalidatePath(`/members/${memberId}`);
  return { success: true };
}
