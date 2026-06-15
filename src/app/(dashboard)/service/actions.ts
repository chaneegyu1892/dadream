'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { getSessionProfile } from '@/lib/auth';
import { revalidateHomeServiceCaches } from '@/lib/dashboard-cache-invalidation';
import { roleAtLeast } from '@/lib/roles';
import { createClient } from '@/lib/supabase/server';

async function requireOfficer(): Promise<{ error?: string }> {
  const session = await getSessionProfile();
  if (!session || !roleAtLeast(session.role, 'officer')) {
    return { error: '편집 권한이 없어요.' };
  }
  return {};
}

const assignSchema = z.object({
  serviceDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  roleId: z.string().uuid(),
  memberId: z.string().uuid(),
});

export async function assignService(input: z.infer<typeof assignSchema>): Promise<{ error?: string }> {
  const auth = await requireOfficer();
  if (auth.error) return auth;

  const parsed = assignSchema.safeParse(input);
  if (!parsed.success) return { error: '입력값을 확인해주세요.' };

  const supabase = await createClient();
  const { error } = await supabase.from('service_assignments').insert({
    service_date: parsed.data.serviceDate,
    role_id: parsed.data.roleId,
    member_id: parsed.data.memberId,
  });

  if (error) {
    return { error: error.code === '23505' ? '이미 배정된 청년이에요.' : '배정에 실패했어요.' };
  }

  revalidateHomeServiceCaches();
  revalidatePath('/service');
  revalidatePath('/');
  return {};
}

export async function unassignService(input: { assignmentId: string }): Promise<{ error?: string }> {
  const auth = await requireOfficer();
  if (auth.error) return auth;

  const parsed = z.object({ assignmentId: z.string().uuid() }).safeParse(input);
  if (!parsed.success) return { error: '입력값을 확인해주세요.' };

  const supabase = await createClient();
  const { error } = await supabase
    .from('service_assignments')
    .delete()
    .eq('id', parsed.data.assignmentId);

  if (error) return { error: '삭제에 실패했어요.' };

  revalidateHomeServiceCaches();
  revalidatePath('/service');
  revalidatePath('/');
  return {};
}

export async function addServiceRole(input: { name: string }): Promise<{ error?: string }> {
  const auth = await requireOfficer();
  if (auth.error) return auth;

  const parsed = z.object({ name: z.string().trim().min(1).max(20) }).safeParse(input);
  if (!parsed.success) return { error: '직책 이름을 확인해주세요.' };

  const supabase = await createClient();
  // sort_order 계산과 INSERT를 DB에서 원자적으로 처리
  const { error } = await supabase.rpc('add_service_role_tx', { p_name: parsed.data.name });

  if (error) {
    return { error: error.code === '23505' ? '이미 있는 직책이에요.' : '추가에 실패했어요.' };
  }

  revalidatePath('/service');
  return {};
}

export async function removeServiceRole(input: { roleId: string }): Promise<{ error?: string }> {
  const auth = await requireOfficer();
  if (auth.error) return auth;

  const parsed = z.object({ roleId: z.string().uuid() }).safeParse(input);
  if (!parsed.success) return { error: '입력값을 확인해주세요.' };

  const supabase = await createClient();
  const { error } = await supabase.from('service_roles').delete().eq('id', parsed.data.roleId);
  if (error) return { error: '삭제에 실패했어요.' };

  // 직책 삭제는 해당 직책의 배정도 함께 사라지므로 홈 배정 캐시를 무효화한다.
  revalidateHomeServiceCaches();
  revalidatePath('/service');
  return {};
}
