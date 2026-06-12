'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

export interface MemberCardData {
  id: string;
  name: string;
  photoUrl: string | null;
  cellId: string | null;
  cellName: string | null;
  duty: string | null;
  isOfficer: boolean;
}

interface MemberGridProps {
  members: MemberCardData[];
  cells: { id: string; name: string }[];
  query: string;
  cellId: string;
  page: number;
  pageSize: number;
  totalCount: number;
}

export function MemberGrid({
  members,
  cells,
  query,
  cellId,
  page,
  pageSize,
  totalCount,
}: MemberGridProps) {
  const [selectedCell, setSelectedCell] = useState(cellId);
  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));
  const hasPrevious = page > 1;
  const hasNext = page < totalPages;

  const pageSummary = useMemo(() => {
    if (totalCount === 0) return '0명';
    const from = (page - 1) * pageSize + 1;
    const to = Math.min(page * pageSize, totalCount);
    return `${from}-${to}명 표시 / 총 ${totalCount}명`;
  }, [page, pageSize, totalCount]);

  function pageHref(nextPage: number) {
    const params = new URLSearchParams();
    if (query) params.set('q', query);
    if (cellId !== 'all') params.set('cell', cellId);
    if (nextPage > 1) params.set('page', String(nextPage));
    const qs = params.toString();
    return qs ? `/members?${qs}` : '/members';
  }

  return (
    <div className="space-y-4">
      <form action="/members" className="space-y-2 rounded-xl border p-3">
        <input type="hidden" name="cell" value={selectedCell} />
        <div className="flex gap-2">
          <Input
            name="q"
            defaultValue={query}
            placeholder="이름 검색"
            className="flex-1"
          />
          <Select value={selectedCell} onValueChange={setSelectedCell}>
            <SelectTrigger className="w-32 shrink-0">
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
          <Button type="submit" size="sm" className="h-9 shrink-0">
            검색
          </Button>
        </div>
        <p className="text-xs text-muted-foreground">
          검색/셀 필터는 서버에서 바로 적용해서 필요한 인원 사진만 불러와요.
        </p>
      </form>

      <div className="flex items-center justify-between text-sm text-muted-foreground">
        <span>{pageSummary}</span>
        {(query || cellId !== 'all') && (
          <Link href="/members" className="underline underline-offset-2">
            필터 초기화
          </Link>
        )}
      </div>

      {members.length === 0 ? (
        <p className="rounded-lg border border-dashed p-8 text-center text-sm text-muted-foreground">
          조건에 맞는 청년이 없어요.
        </p>
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {members.map((m) => (
            <Link
              key={m.id}
              href={`/members/${m.id}`}
              prefetch={false}
              className="flex flex-col items-center gap-2 rounded-xl border p-4 transition-colors hover:bg-accent/50"
            >
              <Avatar className="size-16">
                {m.photoUrl && <AvatarImage src={m.photoUrl} alt={m.name} />}
                <AvatarFallback className="text-lg">{m.name.slice(0, 2)}</AvatarFallback>
              </Avatar>
              <div className="text-center">
                <p className="font-medium leading-tight">{m.name}</p>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  {m.cellName ?? '무소속'}
                </p>
              </div>
              {m.isOfficer && <Badge variant="secondary">임원</Badge>}
            </Link>
          ))}
        </div>
      )}

      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <Button asChild variant="outline" size="sm" aria-disabled={!hasPrevious}>
            <Link href={hasPrevious ? pageHref(page - 1) : pageHref(page)}>
              이전
            </Link>
          </Button>
          <span className="text-sm text-muted-foreground">
            {page} / {totalPages}
          </span>
          <Button asChild variant="outline" size="sm" aria-disabled={!hasNext}>
            <Link href={hasNext ? pageHref(page + 1) : pageHref(page)}>
              다음
            </Link>
          </Button>
        </div>
      )}
    </div>
  );
}
