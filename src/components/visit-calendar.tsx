'use client';

import { useState } from 'react';
import {
  addMonths,
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  format,
  isSameDay,
  isSameMonth,
  isToday,
  startOfMonth,
  startOfWeek,
} from 'date-fns';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export interface CalendarItem {
  id: string;
  date: string; // ISO
  title: string;
  kind: 'event' | 'visit' | 'holiday';
}

const WEEKDAYS = ['일', '월', '화', '수', '목', '금', '토'];

export function VisitCalendar({ items }: { items: CalendarItem[] }) {
  const [month, setMonth] = useState(() => startOfMonth(new Date()));
  const [selectedDay, setSelectedDay] = useState<Date | null>(() => new Date());

  const days = eachDayOfInterval({
    start: startOfWeek(startOfMonth(month)),
    end: endOfWeek(endOfMonth(month)),
  });

  function itemsOn(day: Date) {
    return items.filter((item) => isSameDay(new Date(item.date), day));
  }

  function moveMonth(delta: number) {
    setMonth((m) => addMonths(m, delta));
    setSelectedDay(null);
  }

  const selectedItems = selectedDay ? itemsOn(selectedDay) : [];

  return (
    <div className="rounded-xl border">
      <div className="flex items-center justify-between border-b px-3 py-2">
        <Button variant="ghost" size="sm" onClick={() => moveMonth(-1)}>
          ←
        </Button>
        <p className="font-semibold">{format(month, 'yyyy년 M월')}</p>
        <Button variant="ghost" size="sm" onClick={() => moveMonth(1)}>
          →
        </Button>
      </div>

      <div className="grid grid-cols-7 border-b text-center text-xs text-muted-foreground">
        {WEEKDAYS.map((d, i) => (
          <div key={d} className={cn('py-1.5', i === 0 && 'text-red-500')}>
            {d}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7">
        {days.map((day) => {
          const dayItems = itemsOn(day);
          const isSelected = selectedDay !== null && isSameDay(day, selectedDay);
          const isHoliday = dayItems.some((item) => item.kind === 'holiday');
          return (
            <button
              key={day.toISOString()}
              type="button"
              onClick={() => setSelectedDay(day)}
              className={cn(
                'min-h-16 border-b border-r p-1 text-left align-top text-xs last:border-r-0 md:min-h-20',
                !isSameMonth(day, month) && 'bg-muted/30 text-muted-foreground',
                isSelected && 'bg-accent',
              )}
            >
              <span
                className={cn(
                  'inline-flex size-5 items-center justify-center rounded-full',
                  isToday(day) && 'bg-primary font-semibold text-primary-foreground',
                  (day.getDay() === 0 || isHoliday) && !isToday(day) && 'text-red-500',
                )}
              >
                {format(day, 'd')}
              </span>
              <div className="mt-0.5 space-y-0.5">
                {dayItems.slice(0, 2).map((item) => (
                  <p
                    key={item.id}
                    className={cn(
                      'truncate rounded px-1 py-px leading-tight',
                      calendarItemClassName(item.kind),
                    )}
                    title={item.title}
                  >
                    {item.title}
                  </p>
                ))}
                {dayItems.length > 2 && (
                  <p className="px-1 text-[10px] text-muted-foreground">+{dayItems.length - 2}</p>
                )}
              </div>
            </button>
          );
        })}
      </div>

      {selectedDay && (
        <div className="border-t px-4 py-3">
          <p className="text-sm font-semibold">
            {format(selectedDay, 'M월 d일')} ({WEEKDAYS[selectedDay.getDay()]})
          </p>
          {selectedItems.length === 0 ? (
            <p className="mt-1.5 text-sm text-muted-foreground">이 날은 일정이 없어요.</p>
          ) : (
            <div className="mt-1.5 space-y-1.5">
              {selectedItems.map((item) => (
                <div
                  key={item.id}
                  className={cn(
                    'rounded-lg px-3 py-2 text-sm',
                    calendarItemClassName(item.kind),
                  )}
                >
                  <span className="mr-1.5 text-xs">{calendarItemLabel(item.kind)}</span>
                  {item.title}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function calendarItemClassName(kind: CalendarItem['kind']) {
  if (kind === 'visit') return 'bg-amber-100 text-amber-900';
  if (kind === 'holiday') return 'bg-red-100 text-red-900';
  return 'bg-sky-100 text-sky-900';
}

function calendarItemLabel(kind: CalendarItem['kind']) {
  if (kind === 'visit') return '🏠 심방';
  if (kind === 'holiday') return '🇰🇷 공휴일';
  return '📅 일정';
}
