import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getSafeRedirectOrigin, isSafeOrigin } from '@/lib/auth-redirect';

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');

  // host 헤더가 변조되었거나 프록시 설정이 어긋난 경우, 콜백이 들어온 origin을
  // 신뢰하지 않고 화이트리스트(NEXT_PUBLIC_SITE_URL)로 보정한다.
  const safeOrigin = isSafeOrigin(origin) ? origin : getSafeRedirectOrigin();

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      return NextResponse.redirect(`${safeOrigin}/`);
    }
    console.error('OAuth 콜백 세션 교환 실패:', error.message);
  }

  return NextResponse.redirect(`${safeOrigin}/login?error=auth`);
}
