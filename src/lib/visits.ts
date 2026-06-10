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
