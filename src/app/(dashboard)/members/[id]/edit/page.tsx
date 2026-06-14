import { notFound, redirect } from 'next/navigation';
import { getSessionProfile } from '@/lib/auth';
import { roleAtLeast } from '@/lib/roles';
import { createClient } from '@/lib/supabase/server';
import { MemberEditForm } from '@/components/member-edit-form';
import type { CellRow, MemberDutyRow } from '@/types/db';

interface MemberEditPageProps {
  params: Promise<{ id: string }>;
}

type Baptized = 'true' | 'false' | 'unknown';

function baptizedToSelect(value: boolean | null | undefined): Baptized {
  if (value === true) return 'true';
  if (value === false) return 'false';
  return 'unknown';
}

export default async function MemberEditPage({ params }: MemberEditPageProps) {
  const { id } = await params;
  const session = await getSessionProfile();
  if (!session) redirect('/login');
  if (!roleAtLeast(session.role, 'officer')) redirect(`/members/${id}`);

  const supabase = await createClient();
  const [memberRes, contactRes, cellsRes, dutiesRes] = await Promise.all([
    supabase
      .from('members')
      .select('id, name, cell_id, duty, is_officer, active, gender, registered_at')
      .eq('id', id)
      .single(),
    supabase
      .from('member_contact')
      .select('phone, birth_date, baptized')
      .eq('member_id', id)
      .maybeSingle(),
    supabase.from('cells').select('id, name, sort_order').order('sort_order'),
    supabase.from('member_duties').select('id, name, sort_order, created_at, updated_at').order('sort_order').order('name'),
  ]);

  const member = memberRes.data;
  if (!member) notFound();

  const contact = contactRes.data;
  const cells = (cellsRes.data ?? []) as CellRow[];
  const duties = (dutiesRes.data ?? []) as MemberDutyRow[];
  const dutyOptions = duties.map((d) => d.name);
  if (member.duty && !dutyOptions.includes(member.duty)) {
    dutyOptions.unshift(member.duty);
  }

  return (
    <div className="mx-auto max-w-lg space-y-5">
      <header>
        <h1 className="text-2xl font-bold">명부 수정</h1>
        <p className="mt-1 text-sm text-muted-foreground">{member.name} 님의 명부 정보를 수정해요.</p>
      </header>
      <MemberEditForm
        memberId={member.id}
        cells={cells.map((c) => ({ id: c.id, name: c.name }))}
        dutyOptions={dutyOptions}
        initial={{
          name: member.name,
          cellId: member.cell_id ?? '',
          duty: member.duty ?? '',
          gender: member.gender ?? '',
          registeredAt: member.registered_at ?? '',
          phone: contact?.phone ?? '',
          birthDate: contact?.birth_date ?? '',
          baptized: baptizedToSelect(contact?.baptized),
          isOfficer: member.is_officer,
          active: member.active,
        }}
      />
    </div>
  );
}
