'use client';

import { Suspense, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';

function LoginContent() {
  const searchParams = useSearchParams();
  const errorParam = searchParams.get('error');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(
    errorParam ? '로그인 중 문제가 발생했어요. 다시 시도해주세요.' : null,
  );

  async function signInWithKakao() {
    setLoading(true);
    setError(null);
    const supabase = createClient();
    // NEXT_PUBLIC_SITE_URL이 설정돼 있으면 그 origin을, 없으면 window.location.origin 사용.
    // 단, 화이트리스트 검사는 /auth/callback에서 한 번 더 수행한다.
    const configuredOrigin = process.env.NEXT_PUBLIC_SITE_URL
      ? new URL(process.env.NEXT_PUBLIC_SITE_URL).origin
      : null;
    const redirectOrigin = configuredOrigin ?? window.location.origin;
    const { error: oauthError } = await supabase.auth.signInWithOAuth({
      provider: 'kakao',
      options: {
        redirectTo: `${redirectOrigin}/auth/callback`,
      },
    });
    if (oauthError) {
      setError('카카오 로그인을 시작하지 못했어요. 잠시 후 다시 시도해주세요.');
      setLoading(false);
    }
  }

  return (
    <main className="flex min-h-dvh flex-col items-center justify-center gap-8 px-6">
      <div className="text-center">
        <p className="text-sm font-medium text-muted-foreground">제자광성교회 청년부</p>
        <h1 className="mt-1 text-4xl font-bold tracking-tight">다드림</h1>
        <p className="mt-3 text-sm text-muted-foreground">
          청년부 식구들을 위한 공간이에요.
          <br />
          카카오 계정으로 시작해주세요.
        </p>
      </div>

      <div className="w-full max-w-xs space-y-3">
        <Button
          onClick={signInWithKakao}
          disabled={loading}
          className="h-12 w-full bg-[#FEE500] text-base font-semibold text-[#191919] hover:bg-[#FDD800]"
        >
          {loading ? '연결 중...' : '카카오로 시작하기'}
        </Button>
        {error && <p className="text-center text-sm text-destructive">{error}</p>}
      </div>

      <p className="text-xs text-muted-foreground">
        가입 후 임원 승인을 거쳐 이용할 수 있어요.
      </p>
    </main>
  );
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginContent />
    </Suspense>
  );
}
