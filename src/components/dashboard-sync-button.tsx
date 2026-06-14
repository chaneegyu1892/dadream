'use client';

import { useState, useTransition } from 'react';
import { syncDashboardData, type SyncDashboardDataResult } from '@/app/(dashboard)/admin/sync-actions';
import { Button } from '@/components/ui/button';

export function DashboardSyncButton() {
  const [isPending, startTransition] = useTransition();
  const [result, setResult] = useState<SyncDashboardDataResult | null>(null);

  function handleSync() {
    startTransition(async () => {
      const nextResult = await syncDashboardData();
      setResult(nextResult);
    });
  }

  return (
    <section className="rounded-xl border bg-card p-4 text-sm shadow-sm">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1">
          <h2 className="font-semibold">데이터 동기화</h2>
          <p className="text-muted-foreground">
            명부나 캘린더가 오래된 것 같을 때 눌러주세요. 저장/수정 시에도 자동 갱신되지만,
            필요하면 여기서 다시 불러올 수 있어요.
          </p>
          {result && (
            <p className={result.ok ? 'text-emerald-600' : 'text-destructive'} aria-live="polite">
              {result.message}
            </p>
          )}
        </div>
        <Button type="button" variant="outline" onClick={handleSync} disabled={isPending} className="shrink-0">
          {isPending ? '동기화 중...' : '데이터 동기화'}
        </Button>
      </div>
    </section>
  );
}
