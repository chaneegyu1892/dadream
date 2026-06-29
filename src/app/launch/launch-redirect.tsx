'use client';

import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

/**
 * PWA 홈화면 앱이 먼저 정적 launch 화면을 페인트한 뒤 대시보드로 넘어가게 한다.
 * useEffect는 첫 페인트 이후 실행되므로 launch 화면은 항상 한 번 보인 뒤 이동한다.
 * 인위적 지연(setTimeout) 없이 즉시 `/`로 전환해 콜드 스타트 체감을 줄인다.
 * `router.replace`로 launch 화면을 히스토리에 남기지 않는다.
 */
export function LaunchRedirect() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/');
  }, [router]);

  return null;
}
