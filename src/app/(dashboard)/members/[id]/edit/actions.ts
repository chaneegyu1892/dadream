'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { getSessionProfile } from '@/lib/auth';
import { roleAtLeast } from '@/lib/roles';
import { parseMemberEdit } from '@/lib/member-edit';
import { createClient } from '@/lib/supabase/server';

const memberIdSchema = z.string().uuid();

/**
 * 임원+가 명부에서 관리하는 필드(이름/셀/직분/성별/등록일 등)와
 * 연락처(전화/생일/세례)를 수정한다.
 * 권한은 반드시 세션에서만 도출하고, 클라이언트 입력은 신뢰하지 않는다.
 * member_private는 이 액션에서 다루지 않는다.
 */
export async function updateMember(
  memberId: string,
  formData: FormData,
): Promise<{ error?: string; success?: true }> {
  const session = await getSessionProfile();
  if (!session || !roleAtLeast(session.role, 'officer')) {
    return { error: '명부 수정 권한이 없어요.' };
  }

  if (!memberIdSchema.safeParse(memberId).success) {
    return { error: '잘못된 요청이에요.' };
  }

  const parsed = parseMemberEdit(formData);
  if (!parsed.success) {
    return { error: parsed.error };
  }

  const now = new Date().toISOString();
  const supabase = await createClient();

  const { error: memberError } = await supabase
    .from('members')
    .update({ ...parsed.data.member, updated_at: now })
    .eq('id', memberId);
  if (memberError) {
    console.error('[updateMember] members update 실패:', memberError.message);
    return { error: '명부 정보를 저장하지 못했어요. 다시 시도해주세요.' };
  }

  const { error: contactError } = await supabase
    .from('member_contact')
    .upsert(
      { member_id: memberId, ...parsed.data.contact, updated_at: now },
      { onConflict: 'member_id' },
    );
  if (contactError) {
    console.error('[updateMember] member_contact upsert 실패:', contactError.message);
    return { error: '연락처 정보를 저장하지 못했어요. 다시 시도해주세요.' };
  }

  revalidatePath('/members');
  revalidatePath(`/members/${memberId}`);
  revalidatePath(`/members/${memberId}/edit`);
  revalidatePath('/me');
  return { success: true };
}
