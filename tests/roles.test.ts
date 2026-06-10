import { describe, expect, it } from 'vitest';
import { roleAtLeast, visibleFields } from '@/lib/roles';

describe('roleAtLeast', () => {
  it('pastor ≥ staff ≥ officer ≥ member 서열을 따른다', () => {
    expect(roleAtLeast('pastor', 'staff')).toBe(true);
    expect(roleAtLeast('staff', 'officer')).toBe(true);
    expect(roleAtLeast('officer', 'staff')).toBe(false);
    expect(roleAtLeast('member', 'member')).toBe(true);
    expect(roleAtLeast('member', 'officer')).toBe(false);
  });
});

describe('visibleFields', () => {
  it('member는 기본 필드만 본다', () => {
    const fields = visibleFields('member', false);
    expect(fields).toContain('name');
    expect(fields).toContain('cell');
    expect(fields).not.toContain('phone');
    expect(fields).not.toContain('address');
  });

  it('officer는 연락처·생일까지 보지만 상세 신상은 못 본다', () => {
    const fields = visibleFields('officer', false);
    expect(fields).toContain('phone');
    expect(fields).toContain('birth_date');
    expect(fields).not.toContain('address');
  });

  it('staff와 pastor는 전체를 본다', () => {
    expect(visibleFields('staff', false)).toContain('address');
    expect(visibleFields('pastor', false)).toContain('visit_history');
  });

  it('본인은 역할과 무관하게 자기 정보 전체를 본다', () => {
    expect(visibleFields('member', true)).toContain('address');
  });
});
