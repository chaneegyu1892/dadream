import { describe, expect, it } from 'vitest';
import { parseSelfProfile } from '@/lib/self-profile';

function ok(input: Record<string, unknown>) {
  const result = parseSelfProfile(input);
  if (!result.success) throw new Error(`예상치 못한 실패: ${result.error}`);
  return result.data;
}

describe('parseSelfProfile', () => {
  it('정상 입력을 contact/private 페이로드로 분리한다', () => {
    const data = ok({
      phone: '010-1234-5678',
      birthDate: '1998-03-15',
      baptized: 'true',
      address: '서울시 강남구',
      workplace: '제자광성교회',
      familyInfo: '부모님과 동생 1명',
    });
    expect(data.contact).toEqual({
      phone: '010-1234-5678',
      birth_date: '1998-03-15',
      baptized: true,
    });
    expect(data.private).toEqual({
      address: '서울시 강남구',
      workplace: '제자광성교회',
      family_info: '부모님과 동생 1명',
    });
  });

  it('빈 문자열과 공백은 null로 변환한다', () => {
    const data = ok({
      phone: '',
      birthDate: '   ',
      baptized: 'unknown',
      address: '',
      workplace: '   ',
      familyInfo: '',
    });
    expect(data.contact).toEqual({ phone: null, birth_date: null, baptized: null });
    expect(data.private).toEqual({ address: null, workplace: null, family_info: null });
  });

  it('값 앞뒤 공백을 제거한다', () => {
    const data = ok({ phone: '  010-1111-2222  ', address: '  부산  ' });
    expect(data.contact.phone).toBe('010-1111-2222');
    expect(data.private.address).toBe('부산');
  });

  it('세례 select 값을 boolean/null로 변환한다', () => {
    expect(ok({ baptized: 'true' }).contact.baptized).toBe(true);
    expect(ok({ baptized: 'false' }).contact.baptized).toBe(false);
    expect(ok({ baptized: 'unknown' }).contact.baptized).toBeNull();
    expect(ok({}).contact.baptized).toBeNull();
  });

  it('유효한 생년월일은 통과한다', () => {
    expect(ok({ birthDate: '2000-12-31' }).contact.birth_date).toBe('2000-12-31');
  });

  it('형식이 틀리거나 존재하지 않는 생년월일은 거절한다', () => {
    const badFormat = parseSelfProfile({ birthDate: '2000/12/31' });
    expect(badFormat.success).toBe(false);
    if (!badFormat.success) expect(badFormat.error).toContain('생년월일');

    const impossibleDate = parseSelfProfile({ birthDate: '2000-13-40' });
    expect(impossibleDate.success).toBe(false);
    if (!impossibleDate.success) expect(impossibleDate.error).toContain('생년월일');
  });

  it('전화번호 20자 초과를 거절한다', () => {
    const result = parseSelfProfile({ phone: '0'.repeat(21) });
    expect(result.success).toBe(false);
    if (!result.success) expect(result.error).toContain('전화번호');
  });

  it('주소 200자 초과를 거절한다', () => {
    const result = parseSelfProfile({ address: '가'.repeat(201) });
    expect(result.success).toBe(false);
    if (!result.success) expect(result.error).toContain('주소');
  });

  it('직장/학교 100자 초과를 거절한다', () => {
    const result = parseSelfProfile({ workplace: '가'.repeat(101) });
    expect(result.success).toBe(false);
    if (!result.success) expect(result.error).toContain('직장');
  });

  it('가족 정보 500자 초과를 거절한다', () => {
    const result = parseSelfProfile({ familyInfo: '가'.repeat(501) });
    expect(result.success).toBe(false);
    if (!result.success) expect(result.error).toContain('가족');
  });

  it('FormData 입력도 처리한다', () => {
    const fd = new FormData();
    fd.set('phone', '010-9999-8888');
    fd.set('baptized', 'false');
    fd.set('address', '');
    const result = parseSelfProfile(fd);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.contact.phone).toBe('010-9999-8888');
      expect(result.data.contact.baptized).toBe(false);
      expect(result.data.private.address).toBeNull();
    }
  });
});
