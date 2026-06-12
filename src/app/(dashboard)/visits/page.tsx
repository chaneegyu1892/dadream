import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getSessionProfile } from '@/lib/auth';
import { getCurrentMonthWindow } from '@/lib/dashboard-query';
import { formatSlot, VISIT_STATUS_LABELS } from '@/lib/visits';
import { createClient } from '@/lib/supabase/server';
import { VisitCalendar, type CalendarItem } from '@/components/visit-calendar';
import { VisitActions } from '@/components/visit-actions';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { EventRow, VisitRow } from '@/types/db';

type VisitWithName = VisitRow & { members: { name: string } | null };
type CalendarVisitRow = Pick<VisitRow, 'id' | 'confirmed_at'> & { members: { name: string } | null };

const ACTIVE_VISIT_STATUSES = ['requested', 'proposed', 'confirmed'] as const;
const PAST_VISIT_STATUSES = ['completed', 'declined', 'cancelled'] as const;
const PAST_VISIT_LIMIT = 20;

export default async function VisitsPage() {
  const session = await getSessionProfile();
  if (!session) redirect('/login');

  const supabase = await createClient();
  const { from: calendarFrom, to: calendarTo } = getCurrentMonthWindow();
  const [eventsRes, calendarVisitsRes, activeVisitsRes, pastVisitsRes] = await Promise.all([
    supabase
      .from('events')
      .select('id, title, starts_at, ends_at, location, description')
      .gte('starts_at', calendarFrom)
      .lte('starts_at', calendarTo)
      .order('starts_at')
      .limit(100),
    supabase
      .from('visit_requests')
      .select('id, confirmed_at, members(name)')
      .not('confirmed_at', 'is', null)
      .gte('confirmed_at', calendarFrom)
      .lte('confirmed_at', calendarTo)
      .order('confirmed_at')
      .limit(100),
    supabase
      .from('visit_requests')
      .select(
        'id, member_id, requested_by, preferred_slots, message, status, proposed_slot, confirmed_at, decline_reason, created_at, members(name)',
      )
      .in('status', ACTIVE_VISIT_STATUSES)
      .order('created_at', { ascending: false })
      .limit(50),
    supabase
      .from('visit_requests')
      .select(
        'id, member_id, requested_by, preferred_slots, message, status, proposed_slot, confirmed_at, decline_reason, created_at, members(name)',
      )
      .in('status', PAST_VISIT_STATUSES)
      .order('created_at', { ascending: false })
      .limit(PAST_VISIT_LIMIT),
  ]);

  const events = (eventsRes.data ?? []) as EventRow[];
  const calendarVisits = (calendarVisitsRes.data ?? []) as unknown as CalendarVisitRow[];
  const actionable = (activeVisitsRes.data ?? []) as unknown as VisitWithName[];
  const past = (pastVisitsRes.data ?? []) as unknown as VisitWithName[];
  const isPastor = session.role === 'pastor';

  const calendarItems: CalendarItem[] = [
    ...events.map((e) => ({ id: e.id, date: e.starts_at, title: e.title, kind: 'event' as const })),
    ...calendarVisits
      .filter((v) => v.confirmed_at)
      .map((v) => ({
        id: v.id,
        date: v.confirmed_at as string,
        title: `심방 · ${v.members?.name ?? ''}`,
        kind: 'visit' as const,
      })),
  ];

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">캘린더</h1>
          <p className="mt-1 text-sm text-muted-foreground">청년부 일정과 심방 일정이에요.</p>
        </div>
        <Button asChild size="sm">
          <Link href="/visits/new">심방 신청</Link>
        </Button>
      </header>

      <VisitCalendar items={calendarItems} />

      <section className="space-y-3">
        <h2 className="font-semibold">{isPastor ? '심방 관리' : '내 심방'}</h2>
        {actionable.length === 0 ? (
          <p className="rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground">
            진행 중인 심방이 없어요.
          </p>
        ) : (
          actionable.map((v) => (
            <Card key={v.id}>
              <CardHeader>
                <CardTitle className="flex items-center justify-between text-base">
                  <span>{v.members?.name ?? '이름 없음'}</span>
                  <Badge variant={v.status === 'confirmed' ? 'default' : 'secondary'}>
                    {VISIT_STATUS_LABELS[v.status]}
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <div className="space-y-1 text-muted-foreground">
                  <p>희망: {v.preferred_slots.map(formatSlot).join(' / ')}</p>
                  {v.proposed_slot && v.status === 'proposed' && (
                    <p className="font-medium text-foreground">
                      제안된 시간: {formatSlot(v.proposed_slot)}
                    </p>
                  )}
                  {v.confirmed_at && v.status === 'confirmed' && (
                    <p className="font-medium text-foreground">
                      확정: {new Date(v.confirmed_at).toLocaleString('ko-KR', { dateStyle: 'long', timeStyle: 'short' })}
                    </p>
                  )}
                  {v.message && <p className="whitespace-pre-wrap text-foreground">{v.message}</p>}
                </div>
                {(v.status === 'requested' || v.status === 'proposed' || v.status === 'confirmed') && (
                  <VisitActions
                    visitId={v.id}
                    status={v.status}
                    preferredSlots={v.preferred_slots}
                    viewer={isPastor ? 'pastor' : 'requester'}
                  />
                )}
              </CardContent>
            </Card>
          ))
        )}
      </section>

      {past.length > 0 && (
        <section className="space-y-2">
          <h2 className="font-semibold">지난 심방 최근 {PAST_VISIT_LIMIT}건</h2>
          {past.map((v) => (
            <div key={v.id} className="flex items-center justify-between rounded-lg border px-4 py-2.5 text-sm">
              <span>{v.members?.name ?? '이름 없음'}</span>
              <span className="text-muted-foreground">{VISIT_STATUS_LABELS[v.status]}</span>
            </div>
          ))}
        </section>
      )}
    </div>
  );
}
