import { describe, expect, it } from 'vitest';
import { parseMemberEdit } from '@/lib/member-edit';

const VALID_UUID = '11111111-1111-4111-8111-111111111111';

function ok(input: Record<string, unknown>) {
  const result = parseMemberEdit(input);
  if (!result.success) throw new Error(`예상치 못한 실패: ${result.error}`);
  return result.data;
}

describe('parseMemberEdit', () => {
  it('정상 입력을 member/contact 페이로드로 분리한다', () => {
    const data = ok({
      name: '김진규',
      cellId: VALID_UUID,
      duty: '셀리더',
      isOfficer: 'on',
      active: 'on',
      gender: 'male',
      registeredAt: '2020-01-05',
      phone: '010-1234-5678',
      birthDate: '1998-03-15',
      baptized: 'true',
    });
    expect(data.member).toEqual({
      name: '김진규',
      cell_id: VALID_UUID,
      duty: '셀리더',
      is_officer: true,
      active: true,
      gender: 'male',
      registered_at: '2020-01-05',
    });
    expect(data.contact).toEqual({
      phone: '010-1234-5678',
      birth_date: '1998-03-15',
      baptized: true,
    });
  });

  it('이름/직분/전화번호/성별의 앞뒤 공백을 제거한다', () => {
    const data = ok({
      name: '  김진규  ',
      duty: '  셀리더  ',
      phone: '  010-1111-2222  ',
      gender: '  남  ',
    });
    expect(data.member.name).toBe('김진규');
    expect(data.member.duty).toBe('셀리더');
    expect(data.contact.phone).toBe('010-1111-2222');
    expect(data.member.gender).toBe('남');
  });

  it('빈 문자열·공백만 있는 선택 항목은 null로 변환한다', () => {
    const data = ok({
      name: '김진규',
      cellId: '',
      duty: '   ',
      gender: '',
      registeredAt: '',
      phone: '',
      birthDate: '   ',
      baptized: 'unknown',
    });
    expect(data.member.cell_id).toBeNull();
    expect(data.member.duty).toBeNull();
    expect(data.member.gender).toBeNull();
    expect(data.member.registered_at).toBeNull();
    expect(data.contact.phone).toBeNull();
    expect(data.contact.birth_date).toBeNull();
    expect(data.contact.baptized).toBeNull();
  });

  it('직분은 드롭다운 목록 값만 허용한다', () => {
    for (const duty of ['셀리더', '회장', '부회장', '총무', '부총무', '서기', '회계', '팀장']) {
      expect(ok({ name: '김진규', duty }).member.duty).toBe(duty);
    }

    const result = parseMemberEdit({ name: '김진규', duty: '쎌리더' });
    expect(result.success).toBe(false);
    if (!result.success) expect(result.error).toContain('직분');
  });

  it('없음/none 직분 선택은 null로 변환한다', () => {
    expect(ok({ name: '김진규', duty: '없음' }).member.duty).toBeNull();
    expect(ok({ name: '김진규', duty: 'none' }).member.duty).toBeNull();
  });

  it('DB에서 내려온 사용자 정의 직분 목록으로 검증할 수 있다', () => {
    const custom = parseMemberEdit({ name: '김진규', duty: '찬양팀장' }, ['찬양팀장']);
    expect(custom.success).toBe(true);
    if (custom.success) expect(custom.data.member.duty).toBe('찬양팀장');

    const oldDefault = parseMemberEdit({ name: '김진규', duty: '셀리더' }, ['찬양팀장']);
    expect(oldDefault.success).toBe(false);
  });

  it('이름이 비면 실패한다', () => {
    const result = parseMemberEdit({ name: '   ' });
    expect(result.success).toBe(false);
    if (!result.success) expect(result.error).toContain('이름');
  });

  it('유효한 날짜는 통과한다', () => {
    const data = ok({ name: '김진규', registeredAt: '2020-02-29', birthDate: '2000-12-31' });
    expect(data.member.registered_at).toBe('2020-02-29');
    expect(data.contact.birth_date).toBe('2000-12-31');
  });

  it('존재하지 않는 날짜는 거절한다', () => {
    const badBirth = parseMemberEdit({ name: '김진규', birthDate: '2000-13-40' });
    expect(badBirth.success).toBe(false);
    if (!badBirth.success) expect(badBirth.error).toContain('생년월일');

    const badRegistered = parseMemberEdit({ name: '김진규', registeredAt: '2021-02-30' });
    expect(badRegistered.success).toBe(false);
    if (!badRegistered.success) expect(badRegistered.error).toContain('등록일');

    const badFormat = parseMemberEdit({ name: '김진규', birthDate: '2000/12/31' });
    expect(badFormat.success).toBe(false);
  });

  it('UUID가 아닌 셀 id는 거절하지만 null은 허용한다', () => {
    const bad = parseMemberEdit({ name: '김진규', cellId: 'not-a-uuid' });
    expect(bad.success).toBe(false);
    if (!bad.success) expect(bad.error).toContain('셀');

    const nullCell = ok({ name: '김진규', cellId: null });
    expect(nullCell.member.cell_id).toBeNull();

    const validCell = ok({ name: '김진규', cellId: VALID_UUID });
    expect(validCell.member.cell_id).toBe(VALID_UUID);
  });

  it('체크박스/select boolean을 올바르게 변환한다', () => {
    expect(ok({ name: '김진규', isOfficer: 'on', active: 'on' }).member.is_officer).toBe(true);
    expect(ok({ name: '김진규', isOfficer: 'on' }).member.active).toBe(false);
    expect(ok({ name: '김진규' }).member.is_officer).toBe(false);
    expect(ok({ name: '김진규', active: 'true' }).member.active).toBe(true);

    expect(ok({ name: '김진규', baptized: 'true' }).contact.baptized).toBe(true);
    expect(ok({ name: '김진규', baptized: 'false' }).contact.baptized).toBe(false);
    expect(ok({ name: '김진규', baptized: 'unknown' }).contact.baptized).toBeNull();
  });

  it('FormData 입력도 처리한다', () => {
    const fd = new FormData();
    fd.set('name', '김진규');
    fd.set('isOfficer', 'on');
    fd.set('phone', '010-9999-8888');
    fd.set('baptized', 'false');
    fd.set('cellId', '');
    const result = parseMemberEdit(fd);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.member.name).toBe('김진규');
      expect(result.data.member.is_officer).toBe(true);
      expect(result.data.member.cell_id).toBeNull();
      expect(result.data.contact.phone).toBe('010-9999-8888');
      expect(result.data.contact.baptized).toBe(false);
    }
  });
});
