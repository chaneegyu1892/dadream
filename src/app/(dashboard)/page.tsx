import { Suspense } from 'react';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getSessionProfile } from '@/lib/auth';
import {
  getCachedHomeEvents,
  getCachedHomeService,
  getDashboardAccessToken,
  type HomeServiceRow,
} from '@/lib/dashboard-data-cache';
import { getHomeEventsWindow } from '@/lib/dashboard-query';
import { ROLE_LABELS, roleAtLeast, type UserRole } from '@/lib/roles';
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

      <Suspense fallback={<HomeCardFallback title="예배위원" lines={2} />}>
        <ServiceSummaryCard userId={profile.userId} role={profile.role} />
      </Suspense>

      <Suspense fallback={<HomeCardFallback title="다가오는 일정 (7일)" lines={3} />}>
        <UpcomingEventsCard userId={profile.userId} role={profile.role} />
      </Suspense>

      <Suspense fallback={<HomeCardFallback title={visitCardTitle(profile.role)} lines={3} />}>
        <VisitStatusCard role={profile.role} />
      </Suspense>
    </div>
  );
}

function HomeCardFallback({ title, lines }: { title: string; lines: number }) {
  return (
    <Card aria-label={`${title} 불러오는 중`}>
      <CardHeader>
        <CardTitle className="text-base">{title}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {Array.from({ length: lines }).map((_, index) => (
          <div key={index} className="h-4 animate-pulse rounded bg-muted" />
        ))}
      </CardContent>
    </Card>
  );
}

async function ServiceSummaryCard({ userId, role }: { userId: string; role: UserRole }) {
  const now = new Date();
  const thisWeek = sundayOf(now);
  const nextWeek = sundayOf(now, 1);
  const accessToken = await getDashboardAccessToken();
  const services = accessToken
    ? await getCachedHomeService(userId, role, accessToken, thisWeek, nextWeek).catch((error) => {
        console.error('[HomePage] cached service 조회 실패, live 조회로 폴백:', error);
        return fetchHomeServiceLive(thisWeek, nextWeek);
      })
    : await fetchHomeServiceLive(thisWeek, nextWeek);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">예배위원</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2 text-sm">
        <div className="flex gap-3">
          <span className="shrink-0 font-medium">이번 주</span>
          <span className="text-muted-foreground">{serviceSummary(services, thisWeek)}</span>
        </div>
        <div className="flex gap-3">
          <span className="shrink-0 font-medium">다음 주</span>
          <span className="text-muted-foreground">{serviceSummary(services, nextWeek)}</span>
        </div>
        <Link href="/service" className="inline-block text-xs text-muted-foreground underline">
          배정표 전체 보기
        </Link>
      </CardContent>
    </Card>
  );
}

async function UpcomingEventsCard({ userId, role }: { userId: string; role: UserRole }) {
  const now = new Date();
  const window = getHomeEventsWindow(now);
  const accessToken = await getDashboardAccessToken();
  const events = accessToken
    ? await getCachedHomeEvents(userId, role, accessToken, window).catch((error) => {
        console.error('[HomePage] cached events 조회 실패, live 조회로 폴백:', error);
        return fetchHomeEventsLive(window);
      })
    : await fetchHomeEventsLive(window);
  const upcomingEvents = events.filter((e) => new Date(e.starts_at).getTime() >= now.getTime()).slice(0, 5);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">다가오는 일정 (7일)</CardTitle>
      </CardHeader>
      <CardContent>
        {upcomingEvents.length === 0 ? (
          <p className="text-sm text-muted-foreground">등록된 일정이 없어요.</p>
        ) : (
          <div className="space-y-2 text-sm">
            {upcomingEvents.map((e) => (
              <div key={e.id} className="flex items-center justify-between gap-3">
                <span>{e.title}</span>
                <span className="shrink-0 text-muted-foreground">
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
  );
}

async function VisitStatusCard({ role }: { role: UserRole }) {
  const supabase = await createClient();
  const { data } = await supabase
    .from('visit_requests')
    .select(
      'id, member_id, requested_by, preferred_slots, message, status, proposed_slot, confirmed_at, decline_reason, created_at, members(name)',
    )
    .in('status', ['requested', 'proposed', 'confirmed'])
    .order('created_at', { ascending: false })
    .limit(5);

  const visits = (data ?? []) as unknown as VisitWithName[];
  const seesAllVisits = roleAtLeast(role, 'staff');

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">{visitCardTitle(role)}</CardTitle>
      </CardHeader>
      <CardContent>
        {visits.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            {seesAllVisits ? '대기 중인 신청이 없어요.' : '진행 중인 심방이 없어요.'}
          </p>
        ) : (
          <div className="space-y-2 text-sm">
            {visits.map((v) => (
              <Link key={v.id} href="/visits" className="flex items-center justify-between gap-3">
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
  );
}

function visitCardTitle(role: UserRole) {
  if (role === 'pastor') return '처리할 심방 신청';
  if (roleAtLeast(role, 'staff')) return '전체 심방 현황';
  return '내 심방 현황';
}

async function fetchHomeEventsLive(window: { from: string; to: string }) {
  const supabase = await createClient();
  const { data } = await supabase
    .from('events')
    .select('id, title, starts_at, ends_at, location, description, color')
    .gte('starts_at', window.from)
    .lte('starts_at', window.to)
    .order('starts_at')
    .limit(100);

  return (data ?? []) as EventRow[];
}

async function fetchHomeServiceLive(thisWeek: string, nextWeek: string) {
  const supabase = await createClient();
  const { data } = await supabase
    .from('service_assignments')
    .select('id, service_date, service_roles(name, sort_order), members(name)')
    .in('service_date', [thisWeek, nextWeek]);

  return (data ?? []) as unknown as HomeServiceRow[];
}

function serviceSummary(services: HomeServiceRow[], week: string): string {
  const entries = services
    .filter((s) => s.service_date === week && s.service_roles && s.members)
    .sort((a, b) => (a.service_roles?.sort_order ?? 0) - (b.service_roles?.sort_order ?? 0));
  if (entries.length === 0) return '미배정';
  return entries.map((s) => `${s.service_roles?.name} ${s.members?.name}`).join(' · ');
}
