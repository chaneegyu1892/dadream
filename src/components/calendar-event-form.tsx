'use client';

import { useRouter } from 'next/navigation';
import { useState, useTransition } from 'react';
import { createCalendarEvent } from '@/app/(dashboard)/visits/actions';
import { EVENT_COLOR_OPTIONS, toKstDateOnly, type EventColor } from '@/lib/events';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

const COLOR_SWATCH_CLASS: Record<EventColor, string> = {
  sky: 'bg-sky-500',
  emerald: 'bg-emerald-500',
  amber: 'bg-amber-500',
  violet: 'bg-violet-500',
  pink: 'bg-pink-500',
};

export function CalendarEventForm() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [date, setDate] = useState(() => toKstDateOnly());
  const [startTime, setStartTime] = useState('09:00');
  const [endTime, setEndTime] = useState('');
  const [location, setLocation] = useState('');
  const [description, setDescription] = useState('');
  const [color, setColor] = useState<EventColor>('sky');
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function resetForm() {
    setTitle('');
    setDate(toKstDateOnly());
    setStartTime('09:00');
    setEndTime('');
    setLocation('');
    setDescription('');
    setColor('sky');
    setError(null);
  }

  function submit() {
    setError(null);
    startTransition(async () => {
      const result = await createCalendarEvent({
        title,
        date,
        startTime,
        endTime,
        location,
        description,
        color,
      });

      if (result.error) {
        setError(result.error);
        return;
      }

      resetForm();
      setOpen(false);
      router.refresh();
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm">일정 추가</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>캘린더 일정 추가</DialogTitle>
          <DialogDescription>
            청년부 전체가 볼 일정을 등록해요. 공휴일은 자동으로 빨간색 표시됩니다.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="event-title">제목</Label>
            <Input
              id="event-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              maxLength={80}
              placeholder="예: 금요기도회, 청년부 MT"
            />
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <div className="space-y-1.5 sm:col-span-1">
              <Label htmlFor="event-date">날짜</Label>
              <Input id="event-date" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="event-start">시작</Label>
              <Input id="event-start" type="time" value={startTime} onChange={(e) => setStartTime(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="event-end">종료</Label>
              <Input id="event-end" type="time" value={endTime} onChange={(e) => setEndTime(e.target.value)} />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="event-location">장소 (선택)</Label>
            <Input
              id="event-location"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              maxLength={80}
              placeholder="예: 본당, 교육관"
            />
          </div>

          <div className="space-y-1.5">
            <Label>색상</Label>
            <div className="grid grid-cols-5 gap-2">
              {EVENT_COLOR_OPTIONS.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => setColor(option.value)}
                  className={cn(
                    'flex flex-col items-center gap-1 rounded-lg border p-2 text-xs transition-colors hover:bg-accent/50',
                    color === option.value && 'border-primary bg-accent',
                  )}
                >
                  <span className={cn('size-5 rounded-full', COLOR_SWATCH_CLASS[option.value])} />
                  {option.label}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="event-description">메모 (선택)</Label>
            <Textarea
              id="event-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              maxLength={1000}
              rows={3}
              placeholder="일정 설명이나 준비물을 적어주세요."
            />
          </div>

          {error && <p className="text-sm text-destructive">{error}</p>}

          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => setOpen(false)} disabled={isPending}>
              취소
            </Button>
            <Button type="button" onClick={submit} disabled={isPending}>
              {isPending ? '추가 중...' : '일정 추가'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
