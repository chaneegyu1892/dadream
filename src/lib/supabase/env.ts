/**
 * Supabase 접속에 필요한 환경 변수를 검증해서 반환한다.
 * 누락 시 어떤 변수가 빠졌는지 명확한 에러를 던져 배포 설정 실수를 빨리 드러낸다.
 * (NEXT_PUBLIC_* 리터럴 접근이라 클라이언트 번들에서도 빌드 타임에 인라인된다)
 */
export function getSupabaseEnv(): { url: string; anonKey: string } {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url) {
    throw new Error('NEXT_PUBLIC_SUPABASE_URL 환경 변수가 설정되지 않았습니다.');
  }
  if (!anonKey) {
    throw new Error('NEXT_PUBLIC_SUPABASE_ANON_KEY 환경 변수가 설정되지 않았습니다.');
  }
  return { url, anonKey };
}
