'use client';

import Link from 'next/link';
import { useMemo } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { MemberSearchForm } from '@/components/member-search-form';

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
      <MemberSearchForm cells={cells} query={query} cellId={cellId} />

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
                {m.photoUrl && (
                  <AvatarImage src={m.photoUrl} alt={m.name} loading="lazy" decoding="async" />
                )}
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
          {hasPrevious ? (
            <Button asChild variant="outline" size="sm">
              <Link href={pageHref(page - 1)}>이전</Link>
            </Button>
          ) : (
            <Button variant="outline" size="sm" disabled>
              이전
            </Button>
          )}
          <span className="text-sm text-muted-foreground">
            {page} / {totalPages}
          </span>
          {hasNext ? (
            <Button asChild variant="outline" size="sm">
              <Link href={pageHref(page + 1)}>다음</Link>
            </Button>
          ) : (
            <Button variant="outline" size="sm" disabled>
              다음
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
