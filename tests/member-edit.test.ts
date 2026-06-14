import { describe, expect, it } from 'vitest';
import { parseMemberEdit } from '@/lib/member-edit';

const VALID_UUID = '11111111-1111-4111-8111-111111111111';

function ok(input: Record<string, unknown>, allowedPositions?: readonly string[]) {
  const result = parseMemberEdit(input, allowedPositions);
  if (!result.success) throw new Error(`예상치 못한 실패: ${result.error}`);
  return result.data;
}

describe('parseMemberEdit', () => {
  it('셀 역할과 직책을 동시에 페이로드로 분리한다', () => {
    const data = ok({
      name: '김진규',
      cellId: VALID_UUID,
      cellRole: '셀리더',
      officerPosition: '총무',
      isOfficer: 'on',
      active: 'on',
      gender: '남자',
      registeredAt: '2020-01-05',
      phone: '010-1234-5678',
      birthDate: '1998-03-15',
      baptized: 'true',
    });

    expect(data.member).toEqual({
      name: '김진규',
      cell_id: VALID_UUID,
      cell_role: '셀리더',
      officer_position: '총무',
      duty: '총무',
      is_officer: true,
      active: true,
      gender: '남자',
      registered_at: '2020-01-05',
    });
    expect(data.contact).toEqual({
      phone: '010-1234-5678',
      birth_date: '1998-03-15',
      baptized: true,
    });
  });

  it('직책이 없고 셀리더만 있으면 레거시 duty를 셀리더로 파생한다', () => {
    const data = ok({ name: '김진규', cellRole: '셀리더', officerPosition: '' });
    expect(data.member.cell_role).toBe('셀리더');
    expect(data.member.officer_position).toBeNull();
    expect(data.member.duty).toBe('셀리더');
  });

  it('이름/연락처/성별의 앞뒤 공백을 제거한다', () => {
    const data = ok({
      name: '  김진규  ',
      phone: '  010-1111-2222  ',
      gender: '  남자  ',
      officerPosition: '  회장  ',
    });
    expect(data.member.name).toBe('김진규');
    expect(data.contact.phone).toBe('010-1111-2222');
    expect(data.member.gender).toBe('남자');
    expect(data.member.officer_position).toBe('회장');
  });

  it('빈 문자열·none·없음 선택 항목은 null로 변환한다', () => {
    const data = ok({
      name: '김진규',
      cellId: '',
      cellRole: '없음',
      officerPosition: 'none',
      gender: '',
      registeredAt: '',
      phone: '',
      birthDate: '   ',
      baptized: 'unknown',
    });
    expect(data.member.cell_id).toBeNull();
    expect(data.member.cell_role).toBeNull();
    expect(data.member.officer_position).toBeNull();
    expect(data.member.duty).toBeNull();
    expect(data.member.gender).toBeNull();
    expect(data.member.registered_at).toBeNull();
    expect(data.contact.phone).toBeNull();
    expect(data.contact.birth_date).toBeNull();
    expect(data.contact.baptized).toBeNull();
  });

  it('직책은 기본 드롭다운 목록 값만 허용하고 셀리더는 거절한다', () => {
    for (const position of ['회장', '부회장', '총무', '부총무', '서기', '회계', '팀장']) {
      expect(ok({ name: '김진규', officerPosition: position }).member.officer_position).toBe(position);
    }

    const typo = parseMemberEdit({ name: '김진규', officerPosition: '쎌리더' });
    expect(typo.success).toBe(false);
    if (!typo.success) expect(typo.error).toContain('직책');

    const cellLeaderAsPosition = parseMemberEdit({ name: '김진규', officerPosition: '셀리더' });
    expect(cellLeaderAsPosition.success).toBe(false);
    if (!cellLeaderAsPosition.success) expect(cellLeaderAsPosition.error).toContain('직책');
  });

  it('셀 역할은 없음 또는 셀리더만 허용한다', () => {
    expect(ok({ name: '김진규', cellRole: '셀리더' }).member.cell_role).toBe('셀리더');
    expect(ok({ name: '김진규', cellRole: '없음' }).member.cell_role).toBeNull();

    const bad = parseMemberEdit({ name: '김진규', cellRole: '셀장' });
    expect(bad.success).toBe(false);
    if (!bad.success) expect(bad.error).toContain('셀 역할');
  });

  it('DB에서 내려온 사용자 정의 직책 목록으로 검증할 수 있다', () => {
    const custom = parseMemberEdit({ name: '김진규', officerPosition: '찬양팀장' }, ['찬양팀장']);
    expect(custom.success).toBe(true);
    if (custom.success) expect(custom.data.member.officer_position).toBe('찬양팀장');

    const oldDefault = parseMemberEdit({ name: '김진규', officerPosition: '회장' }, ['찬양팀장']);
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
    fd.set('cellRole', '셀리더');
    fd.set('officerPosition', '회계');
    const result = parseMemberEdit(fd);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.member.name).toBe('김진규');
      expect(result.data.member.is_officer).toBe(true);
      expect(result.data.member.cell_id).toBeNull();
      expect(result.data.member.cell_role).toBe('셀리더');
      expect(result.data.member.officer_position).toBe('회계');
      expect(result.data.member.duty).toBe('회계');
      expect(result.data.contact.phone).toBe('010-9999-8888');
      expect(result.data.contact.baptized).toBe(false);
    }
  });
});
