'use client';

import { useState, useTransition } from 'react';
import { differenceInCalendarDays, parseISO } from 'date-fns';
import { createWedding, deleteWedding } from '@/app/(dashboard)/admin/weddings/actions';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface WeddingEntry {
  id: string;
  memberName: string;
  cellName: string | null;
  partnerName: string | null;
  weddingDate: string | null;
  venue: string | null;
  note: string | null;
}

interface WeddingListProps {
  weddings: WeddingEntry[];
  members: { id: string; name: string }[];
}

function dday(date: string): string {
  const diff = differenceInCalendarDays(parseISO(date), new Date());
  if (diff === 0) return 'D-Day';
  return diff > 0 ? `D-${diff}` : `D+${-diff}`;
}

export function WeddingList({ weddings, members }: WeddingListProps) {
  const [open, setOpen] = useState(false);
  const [memberId, setMemberId] = useState('');
  const [partner, setPartner] = useState('');
  const [date, setDate] = useState('');
  const [venue, setVenue] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function submit() {
    setError(null);
    if (!memberId) {
      setError('청년을 선택해주세요.');
      return;
    }
    startTransition(async () => {
      const result = await createWedding({
        memberId,
        partnerName: partner.trim() || null,
        weddingDate: date || null,
        venue: venue.trim() || null,
        note: null,
      });
      if (result.error) {
        setError(result.error);
        return;
      }
      setOpen(false);
      setMemberId('');
      setPartner('');
      setDate('');
      setVenue('');
    });
  }

  function remove(weddingId: string) {
    setError(null);
    startTransition(async () => {
      const result = await deleteWedding({ weddingId });
      if (result.error) setError(result.error);
    });
  }

  return (
    <div className="space-y-4">
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          <Button size="sm">결혼 예정 추가</Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>결혼 예정 등록</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label>청년</Label>
              <Select value={memberId} onValueChange={setMemberId}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="청년 선택" />
                </SelectTrigger>
                <SelectContent>
                  {members.map((m) => (
                    <SelectItem key={m.id} value={m.id}>
                      {m.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="partner">배우자 이름</Label>
              <Input id="partner" value={partner} onChange={(e) => setPartner(e.target.value)} maxLength={30} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="wedding-date">예식일</Label>
                <Input id="wedding-date" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="venue">예식 장소</Label>
                <Input id="venue" value={venue} onChange={(e) => setVenue(e.target.value)} maxLength={100} />
              </div>
            </div>
            {error && <p className="text-sm text-destructive">{error}</p>}
            <Button onClick={submit} disabled={isPending} className="w-full">
              {isPending ? '등록 중...' : '등록'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {weddings.length === 0 ? (
        <p className="rounded-lg border border-dashed p-8 text-center text-sm text-muted-foreground">
          등록된 결혼 예정 청년이 없어요.
        </p>
      ) : (
        <div className="space-y-2">
          {weddings.map((w) => (
            <div key={w.id} className="flex items-center justify-between rounded-xl border px-4 py-3">
              <div className="min-w-0">
                <p className="font-medium">
                  {w.memberName}
                  {w.partnerName && <span className="text-muted-foreground"> ♥ {w.partnerName}</span>}
                </p>
                <p className="mt-0.5 truncate text-xs text-muted-foreground">
                  {w.weddingDate
                    ? new Date(w.weddingDate).toLocaleDateString('ko-KR', { dateStyle: 'long' })
                    : '예식일 미정'}
                  {w.venue && ` · ${w.venue}`}
                  {w.cellName && ` · ${w.cellName}`}
                </p>
              </div>
              <div className="flex shrink-0 items-center gap-2">
                {w.weddingDate && <Badge>{dday(w.weddingDate)}</Badge>}
                <button
                  onClick={() => remove(w.id)}
                  disabled={isPending}
                  className="text-sm text-muted-foreground hover:text-destructive"
                  aria-label={`${w.memberName} 결혼 예정 삭제`}
                >
                  ✕
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
