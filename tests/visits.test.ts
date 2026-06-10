import { describe, expect, it } from 'vitest';
import { canTransition, VISIT_STATUS_LABELS } from '@/lib/visits';

describe('canTransition', () => {
  it('requested에서 확정/제안/반려/취소가 가능하다', () => {
    expect(canTransition('requested', 'confirmed')).toBe(true);
    expect(canTransition('requested', 'proposed')).toBe(true);
    expect(canTransition('requested', 'declined')).toBe(true);
    expect(canTransition('requested', 'cancelled')).toBe(true);
  });

  it('proposed에서 확정/반려/취소가 가능하다', () => {
    expect(canTransition('proposed', 'confirmed')).toBe(true);
    expect(canTransition('proposed', 'cancelled')).toBe(true);
    expect(canTransition('proposed', 'requested')).toBe(false);
  });

  it('confirmed는 완료/취소만 가능하다', () => {
    expect(canTransition('confirmed', 'completed')).toBe(true);
    expect(canTransition('confirmed', 'cancelled')).toBe(true);
    expect(canTransition('confirmed', 'proposed')).toBe(false);
  });

  it('completed/declined/cancelled는 종결 상태다', () => {
    expect(canTransition('completed', 'confirmed')).toBe(false);
    expect(canTransition('declined', 'requested')).toBe(false);
    expect(canTransition('cancelled', 'requested')).toBe(false);
  });
});

describe('VISIT_STATUS_LABELS', () => {
  it('모든 상태에 한국어 라벨이 있다', () => {
    const statuses = ['requested', 'proposed', 'confirmed', 'completed', 'declined', 'cancelled'] as const;
    for (const status of statuses) {
      expect(VISIT_STATUS_LABELS[status]).toBeTruthy();
    }
  });
});
