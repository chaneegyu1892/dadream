'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { getSessionProfile } from '@/lib/auth';
import { roleAtLeast } from '@/lib/roles';
import { createClient } from '@/lib/supabase/server';

export type MemberDutyActionResult = { success?: true; error?: string };

const dutyIdSchema = z.string().uuid();
const dutyFormSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, '직분 이름을 입력해주세요.')
    .max(30, '직분 이름은 30자 이하로 입력해주세요.')
    .refine((name) => name !== '없음', '`없음`은 기본 선택지라 수정할 수 없어요.'),
  sortOrder: z.coerce.number().int('정렬 순서는 정수로 입력해주세요.').min(0).max(999),
});

async function requireOfficer(): Promise<MemberDutyActionResult | null> {
  const session = await getSessionProfile();
  if (!session || !roleAtLeast(session.role, 'officer')) {
    return { error: '직분 목록을 관리할 권한이 없어요.' };
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
    return { error: '직분을 추가하지 못했어요. 이미 같은 이름이 있는지 확인해주세요.' };
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
    return { error: '수정할 직분을 찾지 못했어요.' };
  }

  const now = new Date().toISOString();
  const { error: dutyError } = await supabase
    .from('member_duties')
    .update({ name: parsed.data.name, sort_order: parsed.data.sortOrder, updated_at: now })
    .eq('id', dutyId);

  if (dutyError) {
    console.error('[updateMemberDuty] 직분 수정 실패:', dutyError.message);
    return { error: '직분을 수정하지 못했어요. 이미 같은 이름이 있는지 확인해주세요.' };
  }

  if (existing.name !== parsed.data.name) {
    const { error: memberError } = await supabase
      .from('members')
      .update({ duty: parsed.data.name, updated_at: now })
      .eq('duty', existing.name);

    if (memberError) {
      console.error('[updateMemberDuty] 명부 직분명 동기화 실패:', memberError.message);
      return { error: '직분명은 바뀌었지만 기존 명부 반영에 실패했어요. 다시 확인해주세요.' };
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
    return { error: '삭제할 직분을 찾지 못했어요.' };
  }

  const { count, error: countError } = await supabase
    .from('members')
    .select('id', { count: 'exact', head: true })
    .eq('duty', duty.name);

  if (countError) {
    console.error('[deleteMemberDuty] 사용 여부 확인 실패:', countError.message);
    return { error: '직분 사용 여부를 확인하지 못했어요.' };
  }

  if ((count ?? 0) > 0) {
    return { error: `현재 ${count}명이 '${duty.name}' 직분을 사용 중이라 삭제할 수 없어요.` };
  }

  const { error: deleteError } = await supabase.from('member_duties').delete().eq('id', dutyId);
  if (deleteError) {
    console.error('[deleteMemberDuty] 삭제 실패:', deleteError.message);
    return { error: '직분을 삭제하지 못했어요.' };
  }

  revalidateDutyPages();
  return { success: true };
}
