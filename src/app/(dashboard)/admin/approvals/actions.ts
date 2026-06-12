'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { getSessionProfile } from '@/lib/auth';
import { roleAtLeast } from '@/lib/roles';
import { createClient } from '@/lib/supabase/server';

const approveSchema = z
  .object({
    profileId: z.string().uuid(),
    role: z.enum(['member', 'officer', 'staff', 'pastor']),
    memberId: z.string().uuid().optional(),
    newMemberName: z.string().trim().min(1).max(30).optional(),
    newMemberCellId: z.string().uuid().nullable().optional(),
  })
  .refine((v) => v.memberId || v.newMemberName, {
    message: '연결할 명부를 선택하거나 새 이름을 입력해주세요.',
  });

export type ApproveInput = z.infer<typeof approveSchema>;

export async function approveProfile(input: ApproveInput): Promise<{ error?: string }> {
  const session = await getSessionProfile();
  if (!session || !roleAtLeast(session.role, 'officer')) {
    return { error: '승인 권한이 없어요.' };
  }

  const parsed = approveSchema.safeParse(input);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? '입력값을 확인해주세요.' };
  }

  const supabase = await createClient();

  // 명부 등록 + 프로필 승인을 DB 단일 트랜잭션으로 처리 (고아 member 방지)
  const { error: txError } = await supabase.rpc('approve_profile_tx', {
    p_profile_id: parsed.data.profileId,
    p_role: parsed.data.role,
    p_member_id: parsed.data.memberId,
    p_new_member_name: parsed.data.newMemberName,
    p_new_member_cell_id: parsed.data.newMemberCellId ?? undefined,
  });

  if (txError) {
    console.error('[approveProfile] approve_profile_tx 실패:', txError.message);
    return { error: '승인 처리에 실패했어요. 이미 처리됐는지 확인해주세요.' };
  }

  const { error: notifyError } = await supabase.rpc('push_notification', {
    target: parsed.data.profileId,
    n_type: 'approval',
    n_title: '가입이 승인되었어요',
    n_body: '다드림 대시보드에 오신 것을 환영해요!',
    n_link: '/',
  });
  if (notifyError) {
    console.error('[approveProfile] push_notification 실패:', notifyError.message);
  }

  revalidatePath('/admin/approvals');
  return {};
}

const rejectSchema = z.object({ profileId: z.string().uuid() });

export async function rejectProfile(input: { profileId: string }): Promise<{ error?: string }> {
  const session = await getSessionProfile();
  if (!session || !roleAtLeast(session.role, 'officer')) {
    return { error: '승인 권한이 없어요.' };
  }

  const parsed = rejectSchema.safeParse(input);
  if (!parsed.success) {
    return { error: '입력값을 확인해주세요.' };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from('profiles')
    .update({ approval: 'rejected' })
    .eq('id', parsed.data.profileId);

  if (error) {
    return { error: '거절 처리에 실패했어요.' };
  }

  revalidatePath('/admin/approvals');
  return {};
}
