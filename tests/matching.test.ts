import { describe, expect, it } from 'vitest';
import { matchCandidates } from '@/lib/matching';

const roster = [
  { id: '1', name: '김민수' },
  { id: '2', name: '김민수' },
  { id: '3', name: '박지은' },
  { id: '4', name: '이 한 결' },
];

describe('matchCandidates', () => {
  it('정확히 일치하는 이름을 전부 반환한다 (동명이인)', () => {
    expect(matchCandidates('김민수', roster).map((m) => m.id)).toEqual(['1', '2']);
  });

  it('닉네임에 섞인 공백·특수문자·이모지를 무시한다', () => {
    expect(matchCandidates('박지은 ♥', roster).map((m) => m.id)).toEqual(['3']);
    expect(matchCandidates('이한결', roster).map((m) => m.id)).toEqual(['4']);
  });

  it('닉네임 안에 실명이 포함된 경우 부분 일치로 찾는다', () => {
    expect(matchCandidates('3셀 박지은입니다', roster).map((m) => m.id)).toEqual(['3']);
  });

  it('일치가 없으면 빈 배열', () => {
    expect(matchCandidates('홍길동', roster)).toEqual([]);
  });

  it('빈 닉네임이면 빈 배열', () => {
    expect(matchCandidates('', roster)).toEqual([]);
    expect(matchCandidates('♥♥', roster)).toEqual([]);
  });
});
