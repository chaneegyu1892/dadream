import { redirect } from 'next/navigation';
import { getSessionProfile } from '@/lib/auth';
import { roleAtLeast } from '@/lib/roles';
import { sundayOf } from '@/lib/weeks';
import { createClient } from '@/lib/supabase/server';
import { ServiceBoard } from '@/components/service-board';
import type { MemberRow } from '@/types/db';

interface ServicePageProps {
  searchParams: Promise<{ week?: string }>;
}

export default async function ServicePage({ searchParams }: ServicePageProps) {
  const session = await getSessionProfile();
  if (!session) redirect('/login');

  const { week } = await searchParams;
  const selectedWeek = week && /^\d{4}-\d{2}-\d{2}$/.test(week) ? week : sundayOf(new Date());
  const canEdit = roleAtLeast(session.role, 'officer');

  const supabase = await createClient();
  const [rolesRes, assignRes, membersRes] = await Promise.all([
    supabase.from('service_roles').select('id, name, sort_order').order('sort_order'),
    supabase
      .from('service_assignments')
      .select('id, service_date, role_id, member_id, members(name)')
      .eq('service_date', selectedWeek),
    canEdit
      ? supabase.from('members').select('id, name').eq('active', true).order('name')
      : Promise.resolve({ data: [] }),
  ]);

  const roles = rolesRes.data ?? [];
  const assignments = (assignRes.data ?? []) as unknown as {
    id: string;
    service_date: string;
    role_id: string;
    member_id: string;
    members: { name: string } | null;
  }[];
  const members = (membersRes.data ?? []) as Pick<MemberRow, 'id' | 'name'>[];

  return (
    <div className="mx-auto max-w-2xl space-y-5">
      <header>
        <h1 className="text-2xl font-bold">예배위원</h1>
        <p className="mt-1 text-sm text-muted-foreground">주일별 예배 섬김이 배정표예요.</p>
      </header>

      <ServiceBoard
        selectedWeek={selectedWeek}
        thisWeek={sundayOf(new Date())}
        roles={roles}
        assignments={assignments.map((a) => ({
          id: a.id,
          roleId: a.role_id,
          memberName: a.members?.name ?? '',
        }))}
        members={members}
        canEdit={canEdit}
      />
    </div>
  );
}
