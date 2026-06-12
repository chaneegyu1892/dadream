'use client';

import { useEffect } from 'react';
import { Button } from '@/components/ui/button';

interface DashboardErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function DashboardError({ error, reset }: DashboardErrorProps) {
  useEffect(() => {
    console.error('[dashboard] 페이지 렌더링 오류:', error);
  }, [error]);

  return (
    <div className="flex min-h-[50dvh] flex-col items-center justify-center gap-4 px-4 text-center">
      <p className="text-3xl">😢</p>
      <h2 className="text-lg font-semibold">페이지를 불러오지 못했어요</h2>
      <p className="text-sm text-muted-foreground">
        일시적인 문제일 수 있어요. 다시 시도해도 안 되면 잠시 후에 들어와주세요.
      </p>
      <Button onClick={reset}>다시 시도</Button>
    </div>
  );
}
