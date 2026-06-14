import { redirect } from 'next/navigation';
import { getSessionProfile } from '@/lib/auth';
import { FIXED_CELL_ROLE } from '@/lib/member-edit';
import { roleAtLeast } from '@/lib/roles';
import { createClient } from '@/lib/supabase/server';
import { MemberForm } from '@/components/member-form';
import type { CellRow, MemberDutyRow } from '@/types/db';

export default async function NewMemberPage() {
  const session = await getSessionProfile();
  if (!session || !roleAtLeast(session.role, 'officer')) redirect('/members');

  const supabase = await createClient();
  const [cellsRes, dutiesRes] = await Promise.all([
    supabase.from('cells').select('id, name, sort_order').order('sort_order'),
    supabase
      .from('member_duties')
      .select('id, name, sort_order, created_at, updated_at')
      .neq('name', FIXED_CELL_ROLE)
      .order('sort_order')
      .order('name'),
  ]);
  const cells = (cellsRes.data ?? []) as CellRow[];
  const duties = (dutiesRes.data ?? []) as MemberDutyRow[];

  return (
    <div className="mx-auto max-w-lg space-y-5">
      <header>
        <h1 className="text-2xl font-bold">청년 추가</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          계정이 없어도 명부에 등록할 수 있어요. 나중에 가입하면 승인 화면에서 연결돼요.
        </p>
      </header>
      <MemberForm
        cells={cells.map((c) => ({ id: c.id, name: c.name }))}
        officerPositionOptions={duties.map((d) => d.name)}
      />
    </div>
  );
}
