import { z } from 'zod';

/**
 * 임원+가 명부에서 수정할 수 있는 필드 페이로드.
 * members 테이블 필드와 member_contact 필드를 분리한다.
 */
export interface MemberEditPayload {
  member: {
    name: string;
    cell_id: string | null;
    duty: string | null;
    is_officer: boolean;
    active: boolean;
    gender: string | null;
    registered_at: string | null;
  };
  contact: {
    phone: string | null;
    birth_date: string | null;
    baptized: boolean | null;
  };
}

export type ParseMemberEditResult =
  | { success: true; data: MemberEditPayload }
  | { success: false; error: string };

/** 빈 문자열·공백만 있는 값은 null로, 나머지 문자열은 trim한다. */
const trimmedOrNull = (value: unknown): unknown => {
  if (typeof value !== 'string') return value ?? null;
  const trimmed = value.trim();
  return trimmed === '' ? null : trimmed;
};

/** 세례 select 값: 'true' -> true, 'false' -> false, 그 외('unknown'/빈값 등) -> null */
const baptizedFromSelect = (value: unknown): boolean | null => {
  if (value === 'true') return true;
  if (value === 'false') return false;
  return null;
};

/** 체크박스/select boolean: 'on'/'true'/true -> true, 그 외 -> false */
const boolFromInput = (value: unknown): boolean => {
  return value === 'on' || value === 'true' || value === true;
};

function isValidDateString(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const [year, month, day] = value.split('-').map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  return (
    date.getUTCFullYear() === year &&
    date.getUTCMonth() === month - 1 &&
    date.getUTCDate() === day
  );
}

const dateSchema = (label: string) =>
  z
    .string()
    .refine(isValidDateString, `${label}은(는) 올바른 YYYY-MM-DD 날짜로 입력해주세요.`)
    .nullable();

/** 이름은 필수: 문자열이 아니거나 없으면 빈 문자열로 만들고 trim해서 min(1)로 거른다. */
const trimmedName = (value: unknown): string =>
  typeof value === 'string' ? value.trim() : '';

const memberEditSchema = z.object({
  name: z.preprocess(
    trimmedName,
    z
      .string()
      .min(1, '이름을 입력해주세요.')
      .max(30, '이름은 30자 이하로 입력해주세요.'),
  ),
  cellId: z.preprocess(
    trimmedOrNull,
    z.string().uuid('셀 정보가 올바르지 않아요.').nullable(),
  ),
  duty: z.preprocess(
    trimmedOrNull,
    z.string().max(30, '직분은 30자 이하로 입력해주세요.').nullable(),
  ),
  isOfficer: z.preprocess(boolFromInput, z.boolean()),
  active: z.preprocess(boolFromInput, z.boolean()),
  gender: z.preprocess(
    trimmedOrNull,
    z.string().max(10, '성별은 10자 이하로 입력해주세요.').nullable(),
  ),
  registeredAt: z.preprocess(trimmedOrNull, dateSchema('등록일')),
  phone: z.preprocess(
    trimmedOrNull,
    z.string().max(20, '전화번호는 20자 이하로 입력해주세요.').nullable(),
  ),
  birthDate: z.preprocess(trimmedOrNull, dateSchema('생년월일')),
  baptized: z.preprocess(baptizedFromSelect, z.boolean().nullable()),
});

/** FormData나 일반 객체에서 값을 꺼낸다 (File 등 문자열이 아닌 값은 무시). */
function readField(input: FormData | Record<string, unknown>, key: string): unknown {
  if (input instanceof FormData) {
    const value = input.get(key);
    return typeof value === 'string' ? value : null;
  }
  return input[key];
}

/**
 * 명부 수정 폼 입력을 검증해 members / member_contact 페이로드로 분리한다.
 * 빈 문자열은 null로 변환되고, 한국어 검증 메시지를 돌려준다.
 */
export function parseMemberEdit(
  input: FormData | Record<string, unknown>,
): ParseMemberEditResult {
  const parsed = memberEditSchema.safeParse({
    name: readField(input, 'name'),
    cellId: readField(input, 'cellId'),
    duty: readField(input, 'duty'),
    isOfficer: readField(input, 'isOfficer'),
    active: readField(input, 'active'),
    gender: readField(input, 'gender'),
    registeredAt: readField(input, 'registeredAt'),
    phone: readField(input, 'phone'),
    birthDate: readField(input, 'birthDate'),
    baptized: readField(input, 'baptized'),
  });

  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues[0]?.message ?? '입력값을 확인해주세요.',
    };
  }

  const v = parsed.data;
  return {
    success: true,
    data: {
      member: {
        name: v.name,
        cell_id: v.cellId,
        duty: v.duty,
        is_officer: v.isOfficer,
        active: v.active,
        gender: v.gender,
        registered_at: v.registeredAt,
      },
      contact: {
        phone: v.phone,
        birth_date: v.birthDate,
        baptized: v.baptized,
      },
    },
  };
}
