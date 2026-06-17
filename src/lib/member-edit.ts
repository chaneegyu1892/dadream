import { z } from 'zod';

/**
 * 임원+가 명부에서 수정할 수 있는 필드 페이로드.
 * members 테이블 필드와 member_contact 필드를 분리한다.
 *
 * 역할은 두 갈래로 나뉜다.
 *   - cell_role        : 셀 역할(없음/셀리더). DB로 관리하지 않는 고정 값.
 *   - officer_position : 직책(회장/부회장/...). member_duties로 관리.
 * 한 사람이 셀리더이면서 직책을 동시에 가질 수 있다.
 * duty는 레거시/호환을 위한 파생 요약값으로만 채운다.
 */
export interface MemberEditPayload {
  member: {
    name: string;
    cell_id: string | null;
    cell_role: string | null;
    officer_position: string | null;
    /** cell_role/officer_position에서 파생한 레거시 요약값. */
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

/** 셀 역할의 유일한 실제 값(없음은 null로 다룬다). */
export const FIXED_CELL_ROLE = '셀리더';

/**
 * member_duties 테이블이 비었거나 조회에 실패했을 때 쓰는 기본 직책 목록.
 * 직책 드롭다운은 셀리더를 포함하지 않는다(셀 역할에서 별도로 다룸).
 * `없음`은 UI에서 고정 의사옵션으로만 다루므로 여기에 포함하지 않는다.
 */
export const DEFAULT_OFFICER_POSITION_OPTIONS = [
  '회장',
  '부회장',
  '총무',
  '부총무',
  '서기',
  '회계',
  '팀장',
] as const;

/** `없음`/빈값 계열은 미지정(null)으로 본다. */
const NONE_TOKENS = new Set(['', 'none', '없음']);

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

/** 역할 입력 정규화: `없음`/none/빈값 -> null, 그 외 문자열은 trim. */
const roleOrNull = (value: unknown): string | null => {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  return NONE_TOKENS.has(trimmed) ? null : trimmed;
};

/** 셀 역할: null 또는 고정값 셀리더만 허용한다. */
const cellRoleSchema = z.preprocess(
  roleOrNull,
  z
    .string()
    .refine((v) => v === FIXED_CELL_ROLE, '셀 역할은 없음 또는 셀리더만 선택할 수 있어요.')
    .nullable(),
);

/** 직책: member_duties 목록(없음 제외)에서만 선택할 수 있다. */
const officerPositionSchema = (allowedPositions: readonly string[]) =>
  z.preprocess(
    roleOrNull,
    z
      .string()
      .refine(
        (v) => allowedPositions.includes(v),
        '직책은 목록에서 선택해주세요.',
      )
      .nullable(),
  );

const buildMemberEditSchema = (allowedPositions: readonly string[]) =>
  z.object({
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
    cellRole: cellRoleSchema,
    officerPosition: officerPositionSchema(allowedPositions),
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
 * 셀 역할/직책에서 레거시 duty 요약값을 만든다.
 * 직책이 있으면 그 값을, 없고 셀리더면 셀리더를, 둘 다 없으면 null.
 * 남아있는 옛 코드(duty만 읽는 화면)의 표시 호환을 위해 채운다.
 */
function deriveLegacyDuty(
  cellRole: string | null,
  officerPosition: string | null,
): string | null {
  if (officerPosition) return officerPosition;
  if (cellRole === FIXED_CELL_ROLE) return FIXED_CELL_ROLE;
  return null;
}

/**
 * 명부 수정 폼 입력을 검증해 members / member_contact 페이로드로 분리한다.
 * 빈 문자열은 null로 변환되고, 한국어 검증 메시지를 돌려준다.
 */
export function parseMemberEdit(
  input: FormData | Record<string, unknown>,
  allowedPositions: readonly string[] = DEFAULT_OFFICER_POSITION_OPTIONS,
): ParseMemberEditResult {
  const parsed = buildMemberEditSchema(allowedPositions).safeParse({
    name: readField(input, 'name'),
    cellId: readField(input, 'cellId'),
    cellRole: readField(input, 'cellRole'),
    officerPosition: readField(input, 'officerPosition'),
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
        cell_role: v.cellRole,
        officer_position: v.officerPosition,
        duty: deriveLegacyDuty(v.cellRole, v.officerPosition),
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
