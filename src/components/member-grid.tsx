'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
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
}

export function MemberGrid({ members, cells }: MemberGridProps) {
  const [query, setQuery] = useState('');
  const [cellFilter, setCellFilter] = useState('all');

  const filtered = useMemo(() => {
    const q = query.trim();
    return members.filter((m) => {
      if (cellFilter !== 'all' && m.cellId !== cellFilter) return false;
      if (q && !m.name.includes(q)) return false;
      return true;
    });
  }, [members, query, cellFilter]);

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="이름 검색"
          className="flex-1"
        />
        <Select value={cellFilter} onValueChange={setCellFilter}>
          <SelectTrigger className="w-32 shrink-0">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">전체 셀</SelectItem>
            {cells.map((c) => (
              <SelectItem key={c.id} value={c.id}>
                {c.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {filtered.length === 0 ? (
        <p className="rounded-lg border border-dashed p-8 text-center text-sm text-muted-foreground">
          조건에 맞는 청년이 없어요.
        </p>
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {filtered.map((m) => (
            <Link
              key={m.id}
              href={`/members/${m.id}`}
              className="flex flex-col items-center gap-2 rounded-xl border p-4 transition-colors hover:bg-accent/50"
            >
              <Avatar className="size-16">
                {m.photoUrl && <AvatarImage src={m.photoUrl} alt={m.name} />}
                <AvatarFallback className="text-lg">{m.name.slice(0, 2)}</AvatarFallback>
              </Avatar>
              <div className="text-center">
                <p className="font-medium leading-tight">{m.name}</p>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  {m.cellName ?? '셀 미지정'}
                </p>
              </div>
              {m.isOfficer && <Badge variant="secondary">임원</Badge>}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
