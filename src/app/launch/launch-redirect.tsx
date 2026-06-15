'use client';

import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

/**
 * PWA 홈화면 앱이 먼저 정적 launch 페이지를 페인트한 뒤 대시보드로 넘어가게 한다.
 * `router.replace`를 써서 현재 launch 화면을 유지한 채 App Router 네비게이션을 시작한다.
 */
export function LaunchRedirect() {
  const router = useRouter();

  useEffect(() => {
    const id = window.setTimeout(() => {
      router.replace('/');
    }, 250);

    return () => window.clearTimeout(id);
  }, [router]);

  return null;
}
