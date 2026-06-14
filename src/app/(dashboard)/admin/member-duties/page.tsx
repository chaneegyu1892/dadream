import { createClient } from '@/lib/supabase/server';
import { MemberDutyManager } from '@/components/member-duty-manager';
import type { MemberDutyRow } from '@/types/db';

export default async function MemberDutiesAdminPage() {
  const supabase = await createClient();
  const { data } = await supabase
    .from('member_duties')
    .select('id, name, sort_order, created_at, updated_at')
    .order('sort_order')
    .order('name');
  const duties = (data ?? []) as MemberDutyRow[];

  return (
    <div className="mx-auto max-w-2xl space-y-5">
      <header>
        <h1 className="text-2xl font-bold">직분 관리</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          명부 수정 화면에서 선택할 수 있는 직분 목록을 관리해요.
        </p>
      </header>
      <MemberDutyManager duties={duties} />
    </div>
  );
}
