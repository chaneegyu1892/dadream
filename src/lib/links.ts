/**
 * 앱 내부 경로(`/...`)만 허용한다.
 * 외부 URL, `javascript:` 등 스킴이 있는 링크, 프로토콜 상대 URL(`//host`)을 차단해
 * DB에서 읽은 링크를 그대로 렌더링할 때의 오픈 리다이렉트/XSS를 방지한다.
 */
export function isSafeInternalLink(link: string): boolean {
  return link.startsWith('/') && !link.startsWith('//');
}
