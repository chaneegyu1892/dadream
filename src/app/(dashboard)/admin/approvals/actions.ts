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
  let memberId = parsed.data.memberId ?? null;

  if (!memberId) {
    const { data: created, error: insertError } = await supabase
      .from('members')
      .insert({
        name: parsed.data.newMemberName,
        cell_id: parsed.data.newMemberCellId ?? null,
        is_officer: roleAtLeast(parsed.data.role, 'officer'),
      })
      .select('id')
      .single();

    if (insertError || !created) {
      return { error: '명부 등록에 실패했어요. 잠시 후 다시 시도해주세요.' };
    }
    memberId = created.id;
  }

  const { error: updateError } = await supabase
    .from('profiles')
    .update({ approval: 'approved', role: parsed.data.role, member_id: memberId })
    .eq('id', parsed.data.profileId);

  if (updateError) {
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
