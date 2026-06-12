'use client';

import { useMemo, useState, type ReactNode } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { filterByQuery, type SearchableItem } from '@/lib/member-search';
import { cn } from '@/lib/utils';

export type MemberPickerItem = SearchableItem;

interface MemberPickerProps {
  items: MemberPickerItem[];
  onSelect: (id: string) => void;
  /** 선택된 항목 id — 기본 트리거의 라벨 표시와 목록 강조에 쓰인다 */
  value?: string | null;
  placeholder?: string;
  title?: string;
  /** 검색과 무관하게 목록 맨 아래 항상 노출되는 항목 (예: 새로 등록) */
  pinnedItems?: MemberPickerItem[];
  /** 커스텀 트리거. 없으면 셀렉트 모양 버튼을 렌더링한다 */
  trigger?: ReactNode;
  disabled?: boolean;
}

/**
 * 명부(수백 명)에서 한 명을 고르는 검색형 피커.
 * 모바일에서 긴 드롭다운 스크롤 대신 이름 타이핑으로 즉시 필터링한다.
 */
export function MemberPicker({
  items,
  onSelect,
  value = null,
  placeholder = '청년 선택',
  title = '청년 선택',
  pinnedItems = [],
  trigger,
  disabled = false,
}: MemberPickerProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');

  const filtered = useMemo(() => filterByQuery(items, query), [items, query]);
  const selected = useMemo(
    () => [...items, ...pinnedItems].find((m) => m.id === value) ?? null,
    [items, pinnedItems, value],
  );

  function choose(id: string) {
    onSelect(id);
    setOpen(false);
    setQuery('');
  }

  function renderRow(item: MemberPickerItem) {
    return (
      <button
        key={item.id}
        type="button"
        onClick={() => choose(item.id)}
        className={cn(
          'flex w-full items-baseline justify-between gap-2 rounded-lg px-3 py-3 text-left text-sm hover:bg-accent',
          item.id === value && 'bg-accent font-medium',
        )}
      >
        <span>{item.name}</span>
        {item.description && (
          <span className="shrink-0 text-xs text-muted-foreground">{item.description}</span>
        )}
      </button>
    );
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (!next) setQuery('');
      }}
    >
      <DialogTrigger asChild disabled={disabled}>
        {trigger ?? (
          <Button
            type="button"
            variant="outline"
            className="w-full justify-between font-normal"
            disabled={disabled}
          >
            <span className={cn(!selected && 'text-muted-foreground')}>
              {selected ? selected.name : placeholder}
            </span>
            <span aria-hidden className="text-muted-foreground">
              ▾
            </span>
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="flex max-h-[80dvh] flex-col gap-3">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>
        <Input
          type="search"
          enterKeyHint="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="이름으로 검색"
          autoFocus
        />
        <div className="-mx-2 flex-1 overflow-y-auto px-2">
          {filtered.length === 0 && pinnedItems.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">
              검색 결과가 없어요.
            </p>
          ) : (
            <div className="space-y-0.5">
              {filtered.map(renderRow)}
              {pinnedItems.length > 0 && (
                <div className="mt-1 border-t pt-1">{pinnedItems.map(renderRow)}</div>
              )}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
