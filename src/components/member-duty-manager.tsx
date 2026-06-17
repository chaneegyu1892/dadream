'use client';

import { useRouter } from 'next/navigation';
import { useState, useTransition } from 'react';
import {
  createMemberDuty,
  deleteMemberDuty,
  updateMemberDuty,
  type MemberDutyActionResult,
} from '@/app/(dashboard)/admin/member-duties/actions';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import type { MemberDutyRow } from '@/types/db';

interface MemberDutyManagerProps {
  duties: MemberDutyRow[];
}

export function MemberDutyManager({ duties }: MemberDutyManagerProps) {
  const router = useRouter();
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function applyResult(result: MemberDutyActionResult, successMessage: string) {
    if (result.error) {
      setError(result.error);
      setMessage(null);
      return;
    }
    setError(null);
    setMessage(successMessage);
    router.refresh();
  }

  function handleCreate(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const formData = new FormData(form);
    setError(null);
    setMessage(null);
    startTransition(async () => {
      const result = await createMemberDuty(formData);
      applyResult(result, '직책을 추가했어요.');
      if (!result.error) form.reset();
    });
  }

  function handleUpdate(dutyId: string, event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    setError(null);
    setMessage(null);
    startTransition(async () => {
      const result = await updateMemberDuty(dutyId, formData);
      applyResult(result, '직책을 수정했어요.');
    });
  }

  function handleDelete(duty: MemberDutyRow) {
    setError(null);
    setMessage(null);
    startTransition(async () => {
      const result = await deleteMemberDuty(duty.id);
      applyResult(result, '직책을 삭제했어요.');
    });
  }

  return (
    <div className="space-y-5">
      <div className="rounded-xl border p-4">
        <h2 className="font-semibold">새 직책 추가</h2>
        <form onSubmit={handleCreate} className="mt-3 grid gap-3 sm:grid-cols-[1fr_7rem_auto]">
          <div className="space-y-1.5">
            <Label htmlFor="new-duty-name">직책명</Label>
            <Input id="new-duty-name" name="name" placeholder="예: 팀장" maxLength={30} required />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="new-duty-order">순서</Label>
            <Input id="new-duty-order" name="sortOrder" type="number" min={0} max={999} defaultValue={duties.length + 1} />
          </div>
          <Button type="submit" disabled={isPending} className="self-end">
            추가
          </Button>
        </form>
      </div>

      <div className="rounded-xl border p-4">
        <h2 className="font-semibold">직책 목록</h2>
        <p className="mt-1 text-xs text-muted-foreground">
          `없음`은 명부 수정 화면의 기본 선택지라 여기서 삭제하지 않아요. `셀리더`는 별도 셀 역할이라 여기서 관리하지 않아요. 사용 중인 직책은 먼저 청년 명부에서 다른 직책으로 바꾼 뒤 삭제할 수 있어요.
        </p>
        <div className="mt-3 space-y-3">
          {duties.length === 0 ? (
            <p className="rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground">
              등록된 직책이 없어요.
            </p>
          ) : (
            duties.map((duty) => (
              <form
                key={duty.id}
                onSubmit={(event) => handleUpdate(duty.id, event)}
                className="grid gap-2 rounded-lg border p-3 sm:grid-cols-[1fr_6rem_auto_auto]"
              >
                <Input name="name" defaultValue={duty.name} maxLength={30} required aria-label="직책명" />
                <Input name="sortOrder" type="number" min={0} max={999} defaultValue={duty.sort_order} aria-label="정렬 순서" />
                <Button type="submit" variant="outline" size="sm" disabled={isPending}>
                  저장
                </Button>
                <Button
                  type="button"
                  variant="destructive"
                  size="sm"
                  disabled={isPending}
                  onClick={() => handleDelete(duty)}
                >
                  삭제
                </Button>
              </form>
            ))
          )}
        </div>
      </div>

      {error && <p className="rounded-lg bg-destructive/10 p-3 text-sm text-destructive">{error}</p>}
      {message && <p className="rounded-lg bg-emerald-500/10 p-3 text-sm text-emerald-700">{message}</p>}
    </div>
  );
}
