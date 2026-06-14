import { z } from 'zod';

/** "내 정보" 폼에서 본인이 직접 수정할 수 있는 연락처/상세 정보 페이로드 */
export interface SelfProfilePayload {
  contact: {
    phone: string | null;
    birth_date: string | null;
    baptized: boolean | null;
  };
  private: {
    address: string | null;
    workplace: string | null;
    family_info: string | null;
  };
}

export type ParseSelfProfileResult =
  | { success: true; data: SelfProfilePayload }
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

const birthDateSchema = z
  .string()
  .refine(isValidDateString, '생년월일은 올바른 YYYY-MM-DD 날짜로 입력해주세요.')
  .nullable();

const selfProfileSchema = z.object({
  phone: z.preprocess(
    trimmedOrNull,
    z.string().max(20, '전화번호는 20자 이하로 입력해주세요.').nullable(),
  ),
  birthDate: z.preprocess(trimmedOrNull, birthDateSchema),
  baptized: z.preprocess(baptizedFromSelect, z.boolean().nullable()),
  address: z.preprocess(
    trimmedOrNull,
    z.string().max(200, '주소는 200자 이하로 입력해주세요.').nullable(),
  ),
  workplace: z.preprocess(
    trimmedOrNull,
    z.string().max(100, '직장/학교는 100자 이하로 입력해주세요.').nullable(),
  ),
  familyInfo: z.preprocess(
    trimmedOrNull,
    z.string().max(500, '가족 정보는 500자 이하로 입력해주세요.').nullable(),
  ),
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
 * 내 정보 폼 입력을 검증해 member_contact / member_private 페이로드로 분리한다.
 * 빈 문자열은 null로 변환되고, 한국어 검증 메시지를 돌려준다.
 */
export function parseSelfProfile(
  input: FormData | Record<string, unknown>,
): ParseSelfProfileResult {
  const parsed = selfProfileSchema.safeParse({
    phone: readField(input, 'phone'),
    birthDate: readField(input, 'birthDate'),
    baptized: readField(input, 'baptized'),
    address: readField(input, 'address'),
    workplace: readField(input, 'workplace'),
    familyInfo: readField(input, 'familyInfo'),
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
      contact: {
        phone: v.phone,
        birth_date: v.birthDate,
        baptized: v.baptized,
      },
      private: {
        address: v.address,
        workplace: v.workplace,
        family_info: v.familyInfo,
      },
    },
  };
}
