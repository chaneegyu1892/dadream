/**
 * 인증 후 redirect 가능한 origin 화이트리스트.
 *
 * 보안 배경:
 * - Supabase Kakao OAuth는 redirectTo(콜백 URL)에 대한 자체 allowlist를 두지만,
 *   콜백이 끝난 뒤 `/` 또는 `/login?error=...`로 다시 redirect할 위치는
 *   우리 코드가 결정한다. 이때 `new URL(request.url).origin`을 그대로 쓰면
 *   콜백을 호출한 호스트를 신뢰하게 되어, 잘못된 origin(예: 잘못 설정된 reverse proxy,
 *   host 헤더 변조)에서도 인증 쿠키가 발급될 수 있다.
 * - 이 헬퍼는 NEXT_PUBLIC_SITE_URL(필수, 빌드/런타임 모두에 박힘)을 화이트리스트로
 *   강제하고, 콜백이 들어온 origin이 화이트리스트에 없으면 안전한 기본값으로 보정한다.
 */
const ALLOWED_ORIGINS = (() => {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL;
  if (siteUrl) {
    try {
      return [new URL(siteUrl).origin];
    } catch {
      // 잘못된 형식이면 fallback으로 진행
    }
  }
  // dev fallback: localhost:3000. 프로덕션에서는 NEXT_PUBLIC_SITE_URL 필수.
  return ['http://localhost:3000'];
})();

/**
 * 주어진 origin 문자열이 신뢰 가능한 화이트리스트에 포함되는지 확인한다.
 * request.url의 origin이 env의 origin과 일치할 때만 true.
 */
export function isSafeOrigin(origin: string | null | undefined): boolean {
  if (!origin) return false;
  return ALLOWED_ORIGINS.includes(origin);
}

/**
 * 안전한 redirect base URL을 반환한다. 화이트리스트 origin이 있으면 그 origin,
 * 없으면 NEXT_PUBLIC_SITE_URL, 그것도 없으면 404로 보낸다.
 *
 * 사용처: /auth/callback에서 인증 완료/실패 후 redirect.
 */
export function getSafeRedirectOrigin(): string {
  return ALLOWED_ORIGINS[0]!;
}
