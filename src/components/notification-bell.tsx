'use client';

import Link from 'next/link';
import { useState, useTransition } from 'react';
import { markAllNotificationsRead } from '@/app/(dashboard)/notification-actions';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { cn } from '@/lib/utils';

export interface NotificationItem {
  id: string;
  title: string;
  body: string | null;
  link: string | null;
  readAt: string | null;
  createdAt: string;
}

interface NotificationBellProps {
  notifications: NotificationItem[];
  unreadCount: number;
}

export function NotificationBell({ notifications, unreadCount }: NotificationBellProps) {
  const [open, setOpen] = useState(false);
  const [, startTransition] = useTransition();

  function onOpenChange(next: boolean) {
    setOpen(next);
    if (next && unreadCount > 0) {
      startTransition(async () => {
        await markAllNotificationsRead();
      });
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm" className="relative" aria-label="알림">
          🔔
          {unreadCount > 0 && (
            <span className="absolute -right-0.5 -top-0.5 flex size-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[70dvh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>알림</DialogTitle>
        </DialogHeader>
        {notifications.length === 0 ? (
          <p className="py-6 text-center text-sm text-muted-foreground">알림이 없어요.</p>
        ) : (
          <div className="space-y-1">
            {notifications.map((n) => {
              const content = (
                <div
                  className={cn(
                    'rounded-lg px-3 py-2.5 text-sm',
                    n.readAt ? 'text-muted-foreground' : 'bg-accent font-medium',
                  )}
                >
                  <p>{n.title}</p>
                  {n.body && <p className="mt-0.5 text-xs text-muted-foreground">{n.body}</p>}
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    {new Date(n.createdAt).toLocaleString('ko-KR', {
                      dateStyle: 'short',
                      timeStyle: 'short',
                    })}
                  </p>
                </div>
              );
              return n.link ? (
                <Link key={n.id} href={n.link} onClick={() => setOpen(false)} className="block">
                  {content}
                </Link>
              ) : (
                <div key={n.id}>{content}</div>
              );
            })}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
