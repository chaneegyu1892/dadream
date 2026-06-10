export type VisitStatus =
  | 'requested'
  | 'proposed'
  | 'confirmed'
  | 'completed'
  | 'declined'
  | 'cancelled';

export const VISIT_STATUS_LABELS: Record<VisitStatus, string> = {
  requested: '신청됨',
  proposed: '시간 제안됨',
  confirmed: '확정',
  completed: '완료',
  declined: '반려',
  cancelled: '취소',
};

const TRANSITIONS: Record<VisitStatus, readonly VisitStatus[]> = {
  requested: ['confirmed', 'proposed', 'declined', 'cancelled'],
  proposed: ['confirmed', 'declined', 'cancelled'],
  confirmed: ['completed', 'cancelled'],
  completed: [],
  declined: [],
  cancelled: [],
};

export function canTransition(from: VisitStatus, to: VisitStatus): boolean {
  return TRANSITIONS[from].includes(to);
}

export type PreferredSlot = {
  date: string; // YYYY-MM-DD
  timeOfDay: 'morning' | 'afternoon' | 'evening';
};

export const TIME_OF_DAY_LABELS: Record<PreferredSlot['timeOfDay'], string> = {
  morning: '오전',
  afternoon: '오후',
  evening: '저녁',
};

const SLOT_HOURS: Record<PreferredSlot['timeOfDay'], string> = {
  morning: '10:00',
  afternoon: '14:00',
  evening: '19:00',
};

/** 희망 슬롯을 한국 시간 기준 대표 시각(timestamptz ISO 문자열)으로 변환한다. */
export function slotToIso(slot: PreferredSlot): string {
  return new Date(`${slot.date}T${SLOT_HOURS[slot.timeOfDay]}:00+09:00`).toISOString();
}

/** "2026-06-14 오후" 형태의 표시용 문자열 */
export function formatSlot(slot: PreferredSlot): string {
  return `${slot.date} ${TIME_OF_DAY_LABELS[slot.timeOfDay]}`;
}
