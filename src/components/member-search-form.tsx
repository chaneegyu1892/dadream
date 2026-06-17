'use client';

import { useRouter } from 'next/navigation';
import { useState, useTransition } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface MemberSearchFormProps {
  cells: { id: string; name: string }[];
  query: string;
  cellId: string;
  /** 기본 명부 개요(검색 전)에서 보여줄 안내 문구. */
  hint?: string;
}

export function MemberSearchForm({ cells, query, cellId, hint }: MemberSearchFormProps) {
  const [selectedCell, setSelectedCell] = useState(cellId);
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  // JS가 있으면 클라이언트 내비게이션으로 즉시 로딩 피드백을 준다.
  // (JS가 없으면 form의 GET 동작이 그대로 폴백된다.)
  function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const input = event.currentTarget.elements.namedItem('q') as HTMLInputElement | null;
    const q = input?.value.trim() ?? '';
    const params = new URLSearchParams();
    if (q) params.set('q', q);
    if (selectedCell !== 'all') params.set('cell', selectedCell);
    const qs = params.toString();
    startTransition(() => router.push(qs ? `/members?${qs}` : '/members'));
  }

  return (
    <form action="/members" method="get" onSubmit={onSubmit} className="space-y-2 rounded-xl border p-3">
      <input type="hidden" name="cell" value={selectedCell} />
      <div className="flex flex-col gap-2 sm:flex-row">
        <Input
          name="q"
          type="search"
          aria-label="이름 검색"
          enterKeyHint="search"
          defaultValue={query}
          placeholder="이름으로 검색"
          className="sm:flex-1"
        />
        <div className="flex gap-2">
          <Select value={selectedCell} onValueChange={setSelectedCell}>
            <SelectTrigger aria-label="셀 선택" className="flex-1 sm:w-32 sm:flex-none">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">전체 셀</SelectItem>
              <SelectItem value="unassigned">무소속</SelectItem>
              {cells.map((c) => (
                <SelectItem key={c.id} value={c.id}>
                  {c.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button type="submit" size="sm" disabled={isPending} className="h-9 shrink-0">
            {isPending ? '검색 중…' : '검색'}
          </Button>
        </div>
      </div>
      <p className="text-xs text-muted-foreground">
        {hint ?? '검색/셀 필터는 서버에서 바로 적용해서 필요한 인원 사진만 불러와요.'}
      </p>
    </form>
  );
}
