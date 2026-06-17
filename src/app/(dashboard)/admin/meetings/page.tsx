import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getSessionProfile } from '@/lib/auth';
import { roleAtLeast } from '@/lib/roles';
import { createClient } from '@/lib/supabase/server';
import { NewMeetingButton } from '@/components/new-meeting-button';
import { Badge } from '@/components/ui/badge';

const MEETINGS_PAGE_LIMIT = 50;

export default async function MeetingsPage() {
  const session = await getSessionProfile();
  if (!session || !roleAtLeast(session.role, 'officer')) redirect('/');

  const supabase = await createClient();
  const { data } = await supabase
    .from('meetings')
    .select('id, title, meeting_date, meeting_items(done)')
    .order('meeting_date', { ascending: false })
    .limit(MEETINGS_PAGE_LIMIT + 1);

  const meetings = (data ?? []).slice(0, MEETINGS_PAGE_LIMIT);
  const reachedMeetingLimit = (data?.length ?? 0) > MEETINGS_PAGE_LIMIT;

  return (
    <div className="mx-auto max-w-2xl space-y-5">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">임원회의</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            회의별 안건과 할 일을 관리해요. 미완료 항목은 다음 회의로 이월할 수 있어요.
          </p>
        </div>
        <NewMeetingButton />
      </header>

      {reachedMeetingLimit && (
        <p className="rounded-lg border bg-muted/40 px-4 py-3 text-sm text-muted-foreground">
          최근 {MEETINGS_PAGE_LIMIT}개 회의만 표시하고 있어요.
        </p>
      )}

      {meetings.length === 0 ? (
        <p className="rounded-lg border border-dashed p-8 text-center text-sm text-muted-foreground">
          아직 회의가 없어요. 첫 회의를 만들어보세요.
        </p>
      ) : (
        <div className="space-y-2">
          {meetings.map((m) => {
            const total = m.meeting_items.length;
            const done = m.meeting_items.filter((i) => i.done).length;
            return (
              <Link
                key={m.id}
                href={`/admin/meetings/${m.id}`}
                className="flex items-center justify-between rounded-xl border px-4 py-3 transition-colors hover:bg-accent/50"
              >
                <div>
                  <p className="font-medium">{m.title}</p>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    {new Date(m.meeting_date).toLocaleDateString('ko-KR', { dateStyle: 'long' })}
                  </p>
                </div>
                <Badge variant={total > 0 && done === total ? 'default' : 'secondary'}>
                  {done}/{total} 완료
                </Badge>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
