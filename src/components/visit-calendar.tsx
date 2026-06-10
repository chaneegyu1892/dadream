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
  kind: 'event' | 'visit';
}

const WEEKDAYS = ['일', '월', '화', '수', '목', '금', '토'];

export function VisitCalendar({ items }: { items: CalendarItem[] }) {
  const [month, setMonth] = useState(() => startOfMonth(new Date()));

  const days = eachDayOfInterval({
    start: startOfWeek(startOfMonth(month)),
    end: endOfWeek(endOfMonth(month)),
  });

  function itemsOn(day: Date) {
    return items.filter((item) => isSameDay(new Date(item.date), day));
  }

  return (
    <div className="rounded-xl border">
      <div className="flex items-center justify-between border-b px-3 py-2">
        <Button variant="ghost" size="sm" onClick={() => setMonth((m) => addMonths(m, -1))}>
          ←
        </Button>
        <p className="font-semibold">{format(month, 'yyyy년 M월')}</p>
        <Button variant="ghost" size="sm" onClick={() => setMonth((m) => addMonths(m, 1))}>
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
          return (
            <div
              key={day.toISOString()}
              className={cn(
                'min-h-16 border-b border-r p-1 text-xs last:border-r-0 md:min-h-20',
                !isSameMonth(day, month) && 'bg-muted/30 text-muted-foreground',
              )}
            >
              <span
                className={cn(
                  'inline-flex size-5 items-center justify-center rounded-full',
                  isToday(day) && 'bg-primary font-semibold text-primary-foreground',
                  day.getDay() === 0 && !isToday(day) && 'text-red-500',
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
                      item.kind === 'visit'
                        ? 'bg-amber-100 text-amber-900'
                        : 'bg-sky-100 text-sky-900',
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
            </div>
          );
        })}
      </div>
    </div>
  );
}
