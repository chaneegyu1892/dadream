'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { getSessionProfile } from '@/lib/auth';
import { roleAtLeast } from '@/lib/roles';
import { canTransition, formatSlot, slotToIso, type PreferredSlot, type VisitStatus } from '@/lib/visits';
import { createClient } from '@/lib/supabase/server';
import type { VisitRow } from '@/types/db';
import type { TablesUpdate } from '@/types/supabase';

const slotSchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  timeOfDay: z.enum(['morning', 'afternoon', 'evening']),
});

const createSchema = z.object({
  memberId: z.string().uuid(),
  slots: z.array(slotSchema).min(1, '희망 시간을 1개 이상 선택해주세요.').max(3),
  message: z.string().trim().max(1000).optional(),
});

export type CreateVisitInput = z.infer<typeof createSchema>;

export async function createVisitRequest(input: CreateVisitInput): Promise<{ error?: string }> {
  const session = await getSessionProfile();
  if (!session || session.approval !== 'approved') {
    return { error: '로그인이 필요해요.' };
  }

  const parsed = createSchema.safeParse(input);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? '입력값을 확인해주세요.' };
  }

  // 본인이 아닌 청년의 심방은 officer+만 대리 신청 가능
  const isSelf = session.memberId === parsed.data.memberId;
  if (!isSelf && !roleAtLeast(session.role, 'officer')) {
    return { error: '본인 심방만 신청할 수 있어요.' };
  }

  const supabase = await createClient();
  const { error } = await supabase.from('visit_requests').insert({
    member_id: parsed.data.memberId,
    requested_by: session.userId,
    preferred_slots: parsed.data.slots,
    message: parsed.data.message || null,
  });

  if (error) {
    return { error: '심방 신청에 실패했어요. 잠시 후 다시 시도해주세요.' };
  }

  const { error: notifyError } = await supabase.rpc('notify_pastors', {
    n_type: 'visit_requested',
    n_title: '새 심방 신청이 있어요',
    n_body: `희망 시간: ${parsed.data.slots.map(formatSlot).join(', ')}`,
    n_link: '/visits',
  });
  if (notifyError) {
    console.error('[createVisitRequest] notify_pastors 실패:', notifyError.message);
  }

  revalidatePath('/visits');
  return {};
}

const decideSchema = z.object({
  visitId: z.string().uuid(),
  action: z.enum(['confirm', 'propose', 'decline', 'accept_proposal', 'cancel', 'complete']),
  slot: slotSchema.optional(),
  reason: z.string().trim().max(500).optional(),
});

export type DecideVisitInput = z.infer<typeof decideSchema>;

/** 액션을 상태 전이로 변환한다 */
const ACTION_TO_STATUS: Record<DecideVisitInput['action'], VisitStatus> = {
  confirm: 'confirmed',
  propose: 'proposed',
  decline: 'declined',
  accept_proposal: 'confirmed',
  cancel: 'cancelled',
  complete: 'completed',
};

const PASTOR_ACTIONS: ReadonlySet<DecideVisitInput['action']> = new Set([
  'confirm',
  'propose',
  'decline',
  'complete',
]);

export async function decideVisit(input: DecideVisitInput): Promise<{ error?: string }> {
  const session = await getSessionProfile();
  if (!session || session.approval !== 'approved') {
    return { error: '로그인이 필요해요.' };
  }

  const parsed = decideSchema.safeParse(input);
  if (!parsed.success) {
    return { error: '입력값을 확인해주세요.' };
  }

  const { visitId, action, slot, reason } = parsed.data;

  if (PASTOR_ACTIONS.has(action) && session.role !== 'pastor') {
    return { error: '목사님만 처리할 수 있어요.' };
  }

  const supabase = await createClient();
  const { data: visitData } = await supabase
    .from('visit_requests')
    .select('id, member_id, requested_by, preferred_slots, status, proposed_slot')
    .eq('id', visitId)
    .single();

  if (!visitData) {
    return { error: '심방 신청을 찾을 수 없어요.' };
  }
  const visit = visitData as Pick<
    VisitRow,
    'id' | 'member_id' | 'requested_by' | 'preferred_slots' | 'status' | 'proposed_slot'
  >;

  // cancel/accept_proposal은 신청 당사자(또는 staff+)만 가능 — RLS와 별개로 명시 검증
  if (!PASTOR_ACTIONS.has(action)) {
    const isOwner = visit.member_id === session.memberId || visit.requested_by === session.userId;
    if (!isOwner && !roleAtLeast(session.role, 'staff')) {
      return { error: '본인의 심방 신청만 처리할 수 있어요.' };
    }
  }

  const nextStatus = ACTION_TO_STATUS[action];
  if (!canTransition(visit.status, nextStatus)) {
    return { error: '이미 처리된 신청이에요.' };
  }

  const update: TablesUpdate<'visit_requests'> = {
    status: nextStatus,
    updated_at: new Date().toISOString(),
  };
  let confirmedSlot: PreferredSlot | null = null;

  if (action === 'confirm') {
    if (!slot) return { error: '확정할 시간을 선택해주세요.' };
    confirmedSlot = slot;
    update.confirmed_at = slotToIso(slot);
  } else if (action === 'accept_proposal') {
    if (!visit.proposed_slot) return { error: '제안된 시간이 없어요.' };
    confirmedSlot = visit.proposed_slot;
    update.confirmed_at = slotToIso(visit.proposed_slot);
  } else if (action === 'propose') {
    if (!slot) return { error: '제안할 시간을 선택해주세요.' };
    update.proposed_slot = slot;
  } else if (action === 'decline') {
    update.decline_reason = reason || null;
  }

  const { error: updateError, count: updatedCount } = await supabase
    .from('visit_requests')
    .update(update, { count: 'exact' })
    .eq('id', visitId)
    .eq('status', visit.status);

  if (updateError) {
    return { error: '처리에 실패했어요. 잠시 후 다시 시도해주세요.' };
  }
  // 낙관적 잠금: 그 사이 다른 사람이 처리해 status가 바뀌었으면 0행 업데이트
  if (updatedCount === 0) {
    return { error: '이미 처리된 신청이에요. 새로고침 후 확인해주세요.' };
  }

  // 신청자에게 알림 (목사님 액션일 때)
  if (visit.requested_by && PASTOR_ACTIONS.has(action)) {
    const titles: Record<string, string> = {
      confirm: `심방이 확정되었어요${confirmedSlot ? ` — ${formatSlot(confirmedSlot)}` : ''}`,
      propose: slot ? `목사님이 다른 시간을 제안했어요 — ${formatSlot(slot)}` : '목사님이 다른 시간을 제안했어요',
      decline: '심방 신청이 반려되었어요',
      complete: '심방이 완료 처리되었어요',
    };
    const { error: notifyError } = await supabase.rpc('push_notification', {
      target: visit.requested_by,
      n_type: `visit_${action}`,
      n_title: titles[action],
      n_body: reason || '',
      n_link: '/visits',
    });
    if (notifyError) {
      console.error('[decideVisit] push_notification 실패:', notifyError.message);
    }
  }

  revalidatePath('/visits');
  return {};
}
