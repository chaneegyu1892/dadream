import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getSessionProfile } from '@/lib/auth';
import { ROLE_LABELS } from '@/lib/roles';
import { formatSlot, VISIT_STATUS_LABELS } from '@/lib/visits';
import { createClient } from '@/lib/supabase/server';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { EventRow, VisitRow } from '@/types/db';

type VisitWithName = VisitRow & { members: { name: string } | null };

export default async function HomePage() {
  const profile = await getSessionProfile();
  if (!profile) redirect('/login');

  const supabase = await createClient();
  const now = new Date();
  const weekLater = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

  const [eventsRes, visitsRes] = await Promise.all([
    supabase
      .from('events')
      .select('id, title, starts_at, ends_at, location, description')
      .gte('starts_at', now.toISOString())
      .lte('starts_at', weekLater.toISOString())
      .order('starts_at')
      .limit(5),
    supabase
      .from('visit_requests')
      .select(
        'id, member_id, requested_by, preferred_slots, message, status, proposed_slot, confirmed_at, decline_reason, created_at, members(name)',
      )
      .in('status', ['requested', 'proposed', 'confirmed'])
      .order('created_at', { ascending: false })
      .limit(5),
  ]);

  const events = (eventsRes.data ?? []) as EventRow[];
  const visits = (visitsRes.data ?? []) as unknown as VisitWithName[];
  const isPastor = profile.role === 'pastor';

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <header>
        <h1 className="text-2xl font-bold">다드림</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {ROLE_LABELS[profile.role]}으로 로그인했어요. 평안한 하루 되세요! 🙏
        </p>
      </header>

      <div className="flex gap-2">
        <Button asChild className="flex-1">
          <Link href="/visits/new">심방 신청하기</Link>
        </Button>
        <Button asChild variant="outline" className="flex-1">
          <Link href="/members">명부 보기</Link>
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">다가오는 일정 (7일)</CardTitle>
        </CardHeader>
        <CardContent>
          {events.length === 0 ? (
            <p className="text-sm text-muted-foreground">등록된 일정이 없어요.</p>
          ) : (
            <div className="space-y-2 text-sm">
              {events.map((e) => (
                <div key={e.id} className="flex items-center justify-between">
                  <span>{e.title}</span>
                  <span className="text-muted-foreground">
                    {new Date(e.starts_at).toLocaleDateString('ko-KR', {
                      month: 'short',
                      day: 'numeric',
                      weekday: 'short',
                    })}
                  </span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">
            {isPastor ? '처리할 심방 신청' : '내 심방 현황'}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {visits.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              {isPastor ? '대기 중인 신청이 없어요.' : '진행 중인 심방이 없어요.'}
            </p>
          ) : (
            <div className="space-y-2 text-sm">
              {visits.map((v) => (
                <Link key={v.id} href="/visits" className="flex items-center justify-between">
                  <span>
                    {v.members?.name ?? ''} ·{' '}
                    <span className="text-muted-foreground">
                      {v.confirmed_at && v.status === 'confirmed'
                        ? new Date(v.confirmed_at).toLocaleDateString('ko-KR')
                        : v.preferred_slots[0]
                          ? formatSlot(v.preferred_slots[0])
                          : ''}
                    </span>
                  </span>
                  <Badge variant={v.status === 'confirmed' ? 'default' : 'secondary'}>
                    {VISIT_STATUS_LABELS[v.status]}
                  </Badge>
                </Link>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
