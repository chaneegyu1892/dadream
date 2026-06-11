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

const createMeetingSchema = z.object({
  title: z.string().trim().min(1, '회의 이름을 입력해주세요.').max(50),
  meetingDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  carryOver: z.boolean(),
});

export async function createMeeting(
  input: z.infer<typeof createMeetingSchema>,
): Promise<{ error?: string; meetingId?: string }> {
  const auth = await requireOfficer();
  if (auth.error) return auth;

  const parsed = createMeetingSchema.safeParse(input);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? '입력값을 확인해주세요.' };

  const supabase = await createClient();
  const { data: meeting, error } = await supabase
    .from('meetings')
    .insert({ title: parsed.data.title, meeting_date: parsed.data.meetingDate })
    .select('id')
    .single();

  if (error || !meeting) return { error: '회의 생성에 실패했어요.' };

  if (parsed.data.carryOver) {
    // 직전 회의의 미완료 항목을 새 회의로 이월
    const { data: lastMeeting } = await supabase
      .from('meetings')
      .select('id')
      .neq('id', meeting.id)
      .order('meeting_date', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (lastMeeting) {
      const { data: undone } = await supabase
        .from('meeting_items')
        .select('id, content, assignee_member_id, sort_order')
        .eq('meeting_id', lastMeeting.id)
        .eq('done', false);

      if (undone && undone.length > 0) {
        const { error: carryError } = await supabase.from('meeting_items').insert(
          undone.map((item) => ({
            meeting_id: meeting.id,
            content: item.content,
            assignee_member_id: item.assignee_member_id,
            carried_from: item.id,
            sort_order: item.sort_order,
          })),
        );
        if (carryError) {
          return { error: '회의는 만들었지만 이월에 실패했어요. 항목을 직접 추가해주세요.', meetingId: meeting.id };
        }
      }
    }
  }

  revalidatePath('/admin/meetings');
  return { meetingId: meeting.id };
}

const addItemSchema = z.object({
  meetingId: z.string().uuid(),
  content: z.string().trim().min(1, '내용을 입력해주세요.').max(500),
  assigneeMemberId: z.string().uuid().nullable(),
});

export async function addMeetingItem(input: z.infer<typeof addItemSchema>): Promise<{ error?: string }> {
  const auth = await requireOfficer();
  if (auth.error) return auth;

  const parsed = addItemSchema.safeParse(input);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? '입력값을 확인해주세요.' };

  const supabase = await createClient();
  const { count } = await supabase
    .from('meeting_items')
    .select('*', { count: 'exact', head: true })
    .eq('meeting_id', parsed.data.meetingId);

  const { error } = await supabase.from('meeting_items').insert({
    meeting_id: parsed.data.meetingId,
    content: parsed.data.content,
    assignee_member_id: parsed.data.assigneeMemberId,
    sort_order: (count ?? 0) + 1,
  });

  if (error) return { error: '항목 추가에 실패했어요.' };

  revalidatePath(`/admin/meetings/${parsed.data.meetingId}`);
  return {};
}

export async function toggleMeetingItem(input: {
  itemId: string;
  done: boolean;
}): Promise<{ error?: string }> {
  const auth = await requireOfficer();
  if (auth.error) return auth;

  const parsed = z.object({ itemId: z.string().uuid(), done: z.boolean() }).safeParse(input);
  if (!parsed.success) return { error: '입력값을 확인해주세요.' };

  const supabase = await createClient();
  const { error } = await supabase
    .from('meeting_items')
    .update({ done: parsed.data.done })
    .eq('id', parsed.data.itemId);

  if (error) return { error: '상태 변경에 실패했어요.' };

  revalidatePath('/admin/meetings', 'layout');
  return {};
}

export async function deleteMeetingItem(input: { itemId: string }): Promise<{ error?: string }> {
  const auth = await requireOfficer();
  if (auth.error) return auth;

  const parsed = z.object({ itemId: z.string().uuid() }).safeParse(input);
  if (!parsed.success) return { error: '입력값을 확인해주세요.' };

  const supabase = await createClient();
  const { error } = await supabase.from('meeting_items').delete().eq('id', parsed.data.itemId);
  if (error) return { error: '삭제에 실패했어요.' };

  revalidatePath('/admin/meetings', 'layout');
  return {};
}
