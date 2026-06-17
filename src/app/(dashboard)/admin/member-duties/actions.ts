'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { getSessionProfile } from '@/lib/auth';
import { revalidateMemberCaches } from '@/lib/dashboard-cache-invalidation';
import { FIXED_CELL_ROLE } from '@/lib/member-edit';
import { roleAtLeast } from '@/lib/roles';
import { createClient } from '@/lib/supabase/server';

export type MemberDutyActionResult = { success?: true; error?: string };

const dutyIdSchema = z.string().uuid();
const dutyFormSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, '직책 이름을 입력해주세요.')
    .max(30, '직책 이름은 30자 이하로 입력해주세요.')
    .refine((name) => name !== '없음', '`없음`은 기본 선택지라 수정할 수 없어요.')
    .refine((name) => name !== FIXED_CELL_ROLE, '`셀리더`는 셀 역할에서 별도로 관리해요.'),
  sortOrder: z.coerce.number().int('정렬 순서는 정수로 입력해주세요.').min(0).max(999),
});

async function requireOfficer(): Promise<MemberDutyActionResult | null> {
  const session = await getSessionProfile();
  if (!session || !roleAtLeast(session.role, 'officer')) {
    return { error: '직책 목록을 관리할 권한이 없어요.' };
  }
  return null;
}

function parseDutyForm(formData: FormData):
  | { success: true; data: { name: string; sortOrder: number } }
  | { success: false; error: string } {
  const parsed = dutyFormSchema.safeParse({
    name: formData.get('name'),
    sortOrder: formData.get('sortOrder') || '0',
  });
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? '입력값을 확인해주세요.' };
  }
  return { success: true, data: parsed.data };
}

function revalidateDutyPages() {
  revalidateMemberCaches();
  revalidatePath('/admin');
  revalidatePath('/admin/member-duties');
  revalidatePath('/members');
}

export async function createMemberDuty(formData: FormData): Promise<MemberDutyActionResult> {
  const authError = await requireOfficer();
  if (authError) return authError;

  const parsed = parseDutyForm(formData);
  if (!parsed.success) return { error: parsed.error };

  const supabase = await createClient();
  const now = new Date().toISOString();
  const { error } = await supabase.from('member_duties').insert({
    name: parsed.data.name,
    sort_order: parsed.data.sortOrder,
    updated_at: now,
  });

  if (error) {
    console.error('[createMemberDuty] 실패:', error.message);
    return { error: '직책을 추가하지 못했어요. 이미 같은 이름이 있는지 확인해주세요.' };
  }

  revalidateDutyPages();
  return { success: true };
}

export async function updateMemberDuty(
  dutyId: string,
  formData: FormData,
): Promise<MemberDutyActionResult> {
  const authError = await requireOfficer();
  if (authError) return authError;
  if (!dutyIdSchema.safeParse(dutyId).success) return { error: '잘못된 요청이에요.' };

  const parsed = parseDutyForm(formData);
  if (!parsed.success) return { error: parsed.error };

  const supabase = await createClient();
  const { data: existing, error: fetchError } = await supabase
    .from('member_duties')
    .select('id, name')
    .eq('id', dutyId)
    .single();

  if (fetchError || !existing) {
    console.error('[updateMemberDuty] 조회 실패:', fetchError?.message);
    return { error: '수정할 직책을 찾지 못했어요.' };
  }

  const now = new Date().toISOString();
  const { error: dutyError } = await supabase
    .from('member_duties')
    .update({ name: parsed.data.name, sort_order: parsed.data.sortOrder, updated_at: now })
    .eq('id', dutyId);

  if (dutyError) {
    console.error('[updateMemberDuty] 직분 수정 실패:', dutyError.message);
    return { error: '직책을 수정하지 못했어요. 이미 같은 이름이 있는지 확인해주세요.' };
  }

  if (existing.name !== parsed.data.name) {
    const { error: positionError } = await supabase
      .from('members')
      .update({ officer_position: parsed.data.name, duty: parsed.data.name, updated_at: now })
      .eq('officer_position', existing.name);

    if (positionError) {
      console.error('[updateMemberDuty] 명부 직책명 동기화 실패:', positionError.message);
      return { error: '직책명은 바뀌었지만 기존 명부 반영에 실패했어요. 다시 확인해주세요.' };
    }

    const { error: legacyError } = await supabase
      .from('members')
      .update({ duty: parsed.data.name, updated_at: now })
      .eq('duty', existing.name);

    if (legacyError) {
      console.error('[updateMemberDuty] 레거시 직책명 동기화 실패:', legacyError.message);
      return { error: '직책명은 바뀌었지만 일부 표시용 값 반영에 실패했어요. 다시 확인해주세요.' };
    }
  }

  revalidateDutyPages();
  return { success: true };
}

export async function deleteMemberDuty(dutyId: string): Promise<MemberDutyActionResult> {
  const authError = await requireOfficer();
  if (authError) return authError;
  if (!dutyIdSchema.safeParse(dutyId).success) return { error: '잘못된 요청이에요.' };

  const supabase = await createClient();
  const { data: duty, error: fetchError } = await supabase
    .from('member_duties')
    .select('id, name')
    .eq('id', dutyId)
    .single();

  if (fetchError || !duty) {
    console.error('[deleteMemberDuty] 조회 실패:', fetchError?.message);
    return { error: '삭제할 직책을 찾지 못했어요.' };
  }

  const [positionUsage, legacyUsage] = await Promise.all([
    supabase
      .from('members')
      .select('id', { count: 'exact', head: true })
      .eq('officer_position', duty.name),
    supabase
      .from('members')
      .select('id', { count: 'exact', head: true })
      .eq('duty', duty.name),
  ]);

  if (positionUsage.error || legacyUsage.error) {
    console.error(
      '[deleteMemberDuty] 사용 여부 확인 실패:',
      positionUsage.error?.message ?? legacyUsage.error?.message,
    );
    return { error: '직책 사용 여부를 확인하지 못했어요.' };
  }

  const usageCount = Math.max(positionUsage.count ?? 0, legacyUsage.count ?? 0);
  if (usageCount > 0) {
    return { error: `현재 ${usageCount}명이 '${duty.name}' 직책을 사용 중이라 삭제할 수 없어요.` };
  }

  const { error: deleteError } = await supabase.from('member_duties').delete().eq('id', dutyId);
  if (deleteError) {
    console.error('[deleteMemberDuty] 삭제 실패:', deleteError.message);
    return { error: '직책을 삭제하지 못했어요.' };
  }

  revalidateDutyPages();
  return { success: true };
}
