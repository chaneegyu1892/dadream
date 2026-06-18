'use client';

import { useEffect } from 'react';

/**
 * 오프라인 안내 페이지. navigator.onLine=false 또는 fetch 실패 시 사용자에게
 * "인터넷을 확인해주세요"를 보여주고, 자동 재시도를 제공한다.
 *
 * 이 라우트는 PWA 서비스워커 navigate fallback(/__offline)을 받지 못해도
 * 사용자가 직접 /__offline을 방문하거나, 향후 sw.js 추가 시 명시적으로 보여줄 수 있다.
 */
export default function OfflinePage() {
  useEffect(() => {
    if (typeof window === 'undefined') return;
    // 5초 후 online 상태면 자동 새로고침 (탐지 시점에서 offline이면 대기)
    const id = setTimeout(() => {
      if (navigator.onLine) {
        location.reload();
      }
    }, 5000);
    return () => clearTimeout(id);
  }, []);

  return (
    <main className="flex min-h-dvh flex-col items-center justify-center gap-3 px-6 text-center">
      <h1 className="text-2xl font-bold">오프라인이에요 🌐</h1>
      <p className="max-w-md text-sm text-muted-foreground">
        인터넷 연결이 없거나 일시적으로 응답이 없어요.
        잠시 후 다시 시도해주세요. 연결이 복구되면 자동으로 새로고침돼요.
      </p>
      <button
        type="button"
        onClick={() => location.reload()}
        className="mt-2 rounded-md bg-foreground px-4 py-2 text-sm font-semibold text-background"
      >
        다시 시도
      </button>
    </main>
  );
}
