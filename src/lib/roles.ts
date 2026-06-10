export type UserRole = 'member' | 'officer' | 'staff' | 'pastor';

export const ROLE_LABELS: Record<UserRole, string> = {
  member: '청년',
  officer: '임원',
  staff: '부장·부감',
  pastor: '목사님',
};

const ROLE_RANK: Record<UserRole, number> = {
  member: 0,
  officer: 1,
  staff: 2,
  pastor: 3,
};

export function roleAtLeast(role: UserRole, min: UserRole): boolean {
  return ROLE_RANK[role] >= ROLE_RANK[min];
}

const BASIC_FIELDS = ['name', 'photo', 'cell', 'duty', 'is_officer'] as const;
const OFFICER_FIELDS = ['phone', 'birth_date', 'baptized'] as const;
const FULL_FIELDS = ['address', 'workplace', 'family_info', 'visit_history'] as const;

export function visibleFields(role: UserRole, isSelf: boolean): string[] {
  if (isSelf || roleAtLeast(role, 'staff')) {
    return [...BASIC_FIELDS, ...OFFICER_FIELDS, ...FULL_FIELDS];
  }
  if (roleAtLeast(role, 'officer')) {
    return [...BASIC_FIELDS, ...OFFICER_FIELDS];
  }
  return [...BASIC_FIELDS];
}
