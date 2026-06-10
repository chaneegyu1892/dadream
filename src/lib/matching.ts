type RosterEntry = { id: string; name: string };

function normalize(value: string): string {
  return value.replace(/[^가-힣a-zA-Z]/g, '');
}

/**
 * 카카오 닉네임으로 명부에서 연결 후보를 찾는다.
 * 정확 일치(동명이인 포함)를 우선 반환하고, 없으면 닉네임에 실명이 포함된 경우를 찾는다.
 */
export function matchCandidates<T extends RosterEntry>(kakaoName: string, roster: T[]): T[] {
  const target = normalize(kakaoName);
  if (!target) return [];

  const exact = roster.filter((entry) => normalize(entry.name) === target);
  if (exact.length > 0) return exact;

  return roster.filter((entry) => {
    const name = normalize(entry.name);
    return name.length >= 2 && target.includes(name);
  });
}
