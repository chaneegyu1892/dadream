'use client';

import { useRouter } from 'next/navigation';
import { useState, useTransition } from 'react';
import { createMeeting } from '@/app/(dashboard)/admin/meetings/actions';
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

export function NewMeetingButton() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [carryOver, setCarryOver] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function submit() {
    setError(null);
    startTransition(async () => {
      const result = await createMeeting({ title: title.trim(), meetingDate: date, carryOver });
      if (result.error && !result.meetingId) {
        setError(result.error);
        return;
      }
      setOpen(false);
      if (result.meetingId) router.push(`/admin/meetings/${result.meetingId}`);
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm">새 회의</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>새 임원회의</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="meeting-title">회의 이름</Label>
            <Input
              id="meeting-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="예: 6월 정기 임원회의"
              maxLength={50}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="meeting-date">날짜</Label>
            <Input id="meeting-date" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
          </div>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={carryOver}
              onChange={(e) => setCarryOver(e.target.checked)}
              className="size-4"
            />
            지난 회의의 미완료 항목 이월하기
          </label>
          {error && <p className="text-sm text-destructive">{error}</p>}
          <Button onClick={submit} disabled={isPending || !title.trim()} className="w-full">
            {isPending ? '만드는 중...' : '회의 만들기'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
