import { Suspense } from 'react';
import { redirect } from 'next/navigation';
import { getSessionProfile } from '@/lib/auth';
import { createClient } from '@/lib/supabase/server';
import { Nav } from '@/components/nav';
import { NotificationBell } from '@/components/notification-bell';
import { LogoutButton } from '@/components/logout-button';
import { Toaster } from '@/components/ui/sonner';
import type { NotificationRow } from '@/types/db';

export default async function DashboardLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const profile = await getSessionProfile();

  if (!profile) redirect('/login');
  if (profile.approval !== 'approved') redirect('/pending');

  return (
    <div className="flex min-h-dvh flex-col md:flex-row">
      <Toaster position="top-center" />
      <Nav role={profile.role} />
      <div className="flex flex-1 flex-col">
        <header className="flex items-center justify-between border-b px-4 py-2 md:justify-end md:px-8">
          <p className="font-bold md:hidden">다드림</p>
          <div className="flex items-center gap-1">
            <Suspense
              fallback={<NotificationBell notifications={[]} unreadCount={0} profileId={profile.userId} />}
            >
              <NotificationBellLoader profileId={profile.userId} />
            </Suspense>
            <LogoutButton />
          </div>
        </header>
        <main className="flex-1 px-4 pb-[calc(6rem+env(safe-area-inset-bottom))] pt-6 md:px-8 md:pb-8">{children}</main>
      </div>
    </div>
  );
}

async function NotificationBellLoader({ profileId }: { profileId: string }) {
  const supabase = await createClient();
  const { data } = await supabase
    .from('notifications')
    .select('id, type, title, body, link, read_at, created_at')
    .eq('profile_id', profileId)
    .order('created_at', { ascending: false })
    .limit(15);

  const notifications = (data ?? []) as NotificationRow[];
  const unreadCount = notifications.filter((n) => !n.read_at).length;

  return (
    <NotificationBell
      notifications={notifications.map((n) => ({
        id: n.id,
        title: n.title,
        body: n.body,
        link: n.link,
        readAt: n.read_at,
        createdAt: n.created_at,
      }))}
      unreadCount={unreadCount}
      profileId={profileId}
    />
  );
}
