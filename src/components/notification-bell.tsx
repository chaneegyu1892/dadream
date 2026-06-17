'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState, useTransition } from 'react';
import { markAllNotificationsRead } from '@/app/(dashboard)/notification-actions';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { isSafeInternalLink } from '@/lib/links';
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
  /** 실시간 구독 대상. 없으면 구독을 건너뛴다(Suspense fallback 등). */
  profileId?: string;
}

export function NotificationBell({ notifications, unreadCount, profileId }: NotificationBellProps) {
  const [open, setOpen] = useState(false);
  // 종을 열면 배지를 즉시 0으로 비운다(서버 왕복 대기 없이). 새 알림이 오면 다시 켠다.
  const [locallyRead, setLocallyRead] = useState(false);
  const [, startTransition] = useTransition();
  const router = useRouter();
  const showUnread = locallyRead ? 0 : unreadCount;

  // 새 알림이 들어오면 로컬 읽음 표시를 해제하고 서버 컴포넌트를 갱신해 배지를 다시 띄운다.
  useEffect(() => {
    if (!profileId) return;
    const supabase = createClient();
    const channel = supabase
      .channel(`notifications:${profileId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `profile_id=eq.${profileId}`,
        },
        () => {
          setLocallyRead(false);
          router.refresh();
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [profileId, router]);

  function onOpenChange(next: boolean) {
    setOpen(next);
    if (next && showUnread > 0) {
      setLocallyRead(true); // 배지 즉시 비우기
      startTransition(async () => {
        await markAllNotificationsRead();
      });
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm" className="relative" aria-label="알림">
          <span aria-hidden="true">🔔</span>
          {showUnread > 0 && (
            <span className="absolute -right-0.5 -top-0.5 flex size-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white">
              {showUnread > 9 ? '9+' : showUnread}
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
                    n.readAt || locallyRead ? 'text-muted-foreground' : 'bg-accent font-medium',
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
              return n.link && isSafeInternalLink(n.link) ? (
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
