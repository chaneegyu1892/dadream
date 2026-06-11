'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { getSessionProfile } from '@/lib/auth';
import { roleAtLeast } from '@/lib/roles';
import { createClient } from '@/lib/supabase/server';

async function requireOfficer(): Promise<{ error?: string }> {
  const session = await getSessionProfile();
  if (!session || !roleAtLeast(session.role, 'officer')) {
    return { error: '임원 권한이 필요해요.' };
  }
  return {};
}

const weddingSchema = z.object({
  memberId: z.string().uuid(),
  partnerName: z.string().trim().max(30).nullable(),
  weddingDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).nullable(),
  venue: z.string().trim().max(100).nullable(),
  note: z.string().trim().max(500).nullable(),
});

export async function createWedding(input: z.infer<typeof weddingSchema>): Promise<{ error?: string }> {
  const auth = await requireOfficer();
  if (auth.error) return auth;

  const parsed = weddingSchema.safeParse(input);
  if (!parsed.success) return { error: '입력값을 확인해주세요.' };

  const supabase = await createClient();
  const { error } = await supabase.from('wedding_plans').insert({
    member_id: parsed.data.memberId,
    partner_name: parsed.data.partnerName,
    wedding_date: parsed.data.weddingDate,
    venue: parsed.data.venue,
    note: parsed.data.note,
  });

  if (error) return { error: '등록에 실패했어요.' };

  revalidatePath('/admin/weddings');
  return {};
}

export async function deleteWedding(input: { weddingId: string }): Promise<{ error?: string }> {
  const auth = await requireOfficer();
  if (auth.error) return auth;

  const parsed = z.object({ weddingId: z.string().uuid() }).safeParse(input);
  if (!parsed.success) return { error: '입력값을 확인해주세요.' };

  const supabase = await createClient();
  const { error } = await supabase.from('wedding_plans').delete().eq('id', parsed.data.weddingId);
  if (error) return { error: '삭제에 실패했어요.' };

  revalidatePath('/admin/weddings');
  return {};
}
