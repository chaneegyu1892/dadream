import { notFound, redirect } from 'next/navigation';
import { getSessionProfile } from '@/lib/auth';
import { roleAtLeast } from '@/lib/roles';
import { createClient } from '@/lib/supabase/server';
import { MeetingChecklist } from '@/components/meeting-checklist';

interface MeetingDetailPageProps {
  params: Promise<{ id: string }>;
}

export default async function MeetingDetailPage({ params }: MeetingDetailPageProps) {
  const { id } = await params;
  const session = await getSessionProfile();
  if (!session || !roleAtLeast(session.role, 'officer')) redirect('/');

  const supabase = await createClient();
  const [meetingRes, itemsRes, membersRes] = await Promise.all([
    supabase.from('meetings').select('id, title, meeting_date').eq('id', id).single(),
    supabase
      .from('meeting_items')
      .select('id, content, done, carried_from, sort_order, assignee_member_id, members(name)')
      .eq('meeting_id', id)
      .order('sort_order'),
    supabase.from('members').select('id, name').eq('active', true).eq('is_officer', true).order('name'),
  ]);

  if (!meetingRes.data) notFound();
  const meeting = meetingRes.data;
  const items = (itemsRes.data ?? []) as unknown as {
    id: string;
    content: string;
    done: boolean;
    carried_from: string | null;
    assignee_member_id: string | null;
    members: { name: string } | null;
  }[];

  return (
    <div className="mx-auto max-w-2xl space-y-5">
      <header>
        <h1 className="text-2xl font-bold">{meeting.title}</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {new Date(meeting.meeting_date).toLocaleDateString('ko-KR', { dateStyle: 'long' })}
        </p>
      </header>

      <MeetingChecklist
        meetingId={meeting.id}
        items={items.map((i) => ({
          id: i.id,
          content: i.content,
          done: i.done,
          carried: Boolean(i.carried_from),
          assigneeName: i.members?.name ?? null,
        }))}
        officers={(membersRes.data ?? []) as { id: string; name: string }[]}
      />
    </div>
  );
}
