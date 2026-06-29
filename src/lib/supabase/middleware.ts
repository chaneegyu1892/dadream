import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';
import { getSupabaseEnv } from '@/lib/supabase/env';

const PUBLIC_PATHS = ['/login', '/launch', '/auth', '/pending', '/manifest.webmanifest', '/offline'];

export async function updateSession(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const isPublic = PUBLIC_PATHS.some((path) => pathname.startsWith(path));

  if (isPublic) {
    return NextResponse.next({ request });
  }

  let supabaseResponse = NextResponse.next({ request });

  const { url: supabaseUrl, anonKey } = getSupabaseEnv();
  const supabase = createServerClient(
    supabaseUrl,
    anonKey,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options),
          );
        },
      },
    },
  );

  // getClaims()는 세션 토큰을 검증·갱신한다. 비대칭 JWT 서명키를 쓰면 Auth 서버 왕복 없이
  // 로컬에서 서명만 검증하고(대칭 키면 내부적으로 getUser로 폴백 — 기존과 동일하게 안전),
  // getSession을 거치므로 만료 임박 토큰은 그대로 갱신된다.
  const { data } = await supabase.auth.getClaims();

  if (!data?.claims) {
    const url = request.nextUrl.clone();
    url.pathname = '/login';
    return NextResponse.redirect(url);
  }

  return supabaseResponse;
}
