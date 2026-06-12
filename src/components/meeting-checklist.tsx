'use client';

import { useState, useTransition } from 'react';
import {
  addMeetingItem,
  deleteMeetingItem,
  toggleMeetingItem,
} from '@/app/(dashboard)/admin/meetings/actions';
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
import { cn } from '@/lib/utils';

interface ChecklistItem {
  id: string;
  content: string;
  done: boolean;
  carried: boolean;
  assigneeName: string | null;
}

interface MeetingChecklistProps {
  meetingId: string;
  items: ChecklistItem[];
  officers: { id: string; name: string }[];
}

const NO_ASSIGNEE = '__none__';

export function MeetingChecklist({ meetingId, items, officers }: MeetingChecklistProps) {
  const [content, setContent] = useState('');
  const [assignee, setAssignee] = useState(NO_ASSIGNEE);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function run(action: () => Promise<{ error?: string }>) {
    setError(null);
    startTransition(async () => {
      const result = await action();
      if (result.error) setError(result.error);
    });
  }

  function addItem() {
    const trimmed = content.trim();
    if (!trimmed) return;
    run(() =>
      addMeetingItem({
        meetingId,
        content: trimmed,
        assigneeMemberId: assignee === NO_ASSIGNEE ? null : assignee,
      }),
    );
    setContent('');
    setAssignee(NO_ASSIGNEE);
  }

  return (
    <div className="space-y-4">
      <div className="space-y-1.5">
        {items.length === 0 && (
          <p className="rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground">
            아직 항목이 없어요. 아래에서 안건이나 할 일을 추가해보세요.
          </p>
        )}
        {items.map((item) => (
          <div
            key={item.id}
            className="flex items-center gap-3 rounded-lg border px-3 py-2.5"
          >
            <input
              type="checkbox"
              checked={item.done}
              disabled={isPending}
              onChange={(e) => run(() => toggleMeetingItem({ itemId: item.id, done: e.target.checked }))}
              className="size-5 shrink-0"
              aria-label={`${item.content} 완료 여부`}
            />
            <div className="min-w-0 flex-1">
              <p className={cn('text-sm', item.done && 'text-muted-foreground line-through')}>
                {item.content}
              </p>
              <div className="mt-0.5 flex gap-1.5">
                {item.assigneeName && (
                  <span className="text-xs text-muted-foreground">담당: {item.assigneeName}</span>
                )}
                {item.carried && <Badge variant="outline" className="text-xs">이월</Badge>}
              </div>
            </div>
            <button
              onClick={() => {
                if (!window.confirm(`'${item.content}' 항목을 삭제할까요?`)) return;
                run(() => deleteMeetingItem({ itemId: item.id }));
              }}
              disabled={isPending}
              className="-my-2 -mr-2 shrink-0 p-2 text-sm text-muted-foreground hover:text-destructive"
              aria-label={`${item.content} 삭제`}
            >
              ✕
            </button>
          </div>
        ))}
      </div>

      <div className="space-y-2 rounded-xl border p-3">
        <Input
          value={content}
          onChange={(e) => setContent(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && addItem()}
          placeholder="안건 또는 할 일 입력"
          maxLength={500}
        />
        <div className="flex gap-2">
          <Select value={assignee} onValueChange={setAssignee}>
            <SelectTrigger className="flex-1">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={NO_ASSIGNEE}>담당자 없음</SelectItem>
              {officers.map((o) => (
                <SelectItem key={o.id} value={o.id}>
                  {o.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button onClick={addItem} disabled={isPending || !content.trim()}>
            추가
          </Button>
        </div>
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}
    </div>
  );
}
