import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getSessionProfile } from '@/lib/auth';
import { ROLE_LABELS, roleAtLeast } from '@/lib/roles';
import { formatSlot, VISIT_STATUS_LABELS } from '@/lib/visits';
import { sundayOf } from '@/lib/weeks';
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

  const thisWeek = sundayOf(now);
  const nextWeek = sundayOf(now, 1);

  const [eventsRes, visitsRes, serviceRes] = await Promise.all([
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
    supabase
      .from('service_assignments')
      .select('id, service_date, service_roles(name, sort_order), members(name)')
      .in('service_date', [thisWeek, nextWeek]),
  ]);

  const events = (eventsRes.data ?? []) as EventRow[];
  const visits = (visitsRes.data ?? []) as unknown as VisitWithName[];
  const services = (serviceRes.data ?? []) as unknown as {
    id: string;
    service_date: string;
    service_roles: { name: string; sort_order: number } | null;
    members: { name: string } | null;
  }[];
  const isPastor = profile.role === 'pastor';
  // staff(부장/부감)도 RLS상 모든 심방을 보므로 제목을 그에 맞춘다
  const seesAllVisits = roleAtLeast(profile.role, 'staff');

  function serviceSummary(week: string): string {
    const entries = services
      .filter((s) => s.service_date === week && s.service_roles && s.members)
      .sort((a, b) => (a.service_roles?.sort_order ?? 0) - (b.service_roles?.sort_order ?? 0));
    if (entries.length === 0) return '미배정';
    return entries.map((s) => `${s.service_roles?.name} ${s.members?.name}`).join(' · ');
  }

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
        <Button asChild variant="outline" className="flex-1">
          <Link href="/me">내 정보 수정</Link>
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">예배위원</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <div className="flex gap-3">
            <span className="shrink-0 font-medium">이번 주</span>
            <span className="text-muted-foreground">{serviceSummary(thisWeek)}</span>
          </div>
          <div className="flex gap-3">
            <span className="shrink-0 font-medium">다음 주</span>
            <span className="text-muted-foreground">{serviceSummary(nextWeek)}</span>
          </div>
          <Link href="/service" className="inline-block text-xs text-muted-foreground underline">
            배정표 전체 보기
          </Link>
        </CardContent>
      </Card>

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
            {isPastor ? '처리할 심방 신청' : seesAllVisits ? '전체 심방 현황' : '내 심방 현황'}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {visits.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              {seesAllVisits ? '대기 중인 신청이 없어요.' : '진행 중인 심방이 없어요.'}
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
