import { redirect } from 'next/navigation';
import { getSessionProfile } from '@/lib/auth';
import { roleAtLeast } from '@/lib/roles';
import { createClient } from '@/lib/supabase/server';
import { VisitRequestForm } from '@/components/visit-request-form';
import type { MemberRow } from '@/types/db';

export default async function NewVisitPage() {
  const session = await getSessionProfile();
  if (!session) redirect('/login');

  const canProxy = roleAtLeast(session.role, 'officer');
  let members: { id: string; name: string }[] = [];

  if (canProxy) {
    const supabase = await createClient();
    const { data } = await supabase
      .from('members')
      .select('id, name, photo_path, cell_id, duty, is_officer, active')
      .eq('active', true)
      .order('name');
    members = ((data ?? []) as MemberRow[]).map((m) => ({ id: m.id, name: m.name }));
  }

  if (!canProxy && !session.memberId) {
    redirect('/visits');
  }

  return (
    <div className="mx-auto max-w-lg space-y-5">
      <header>
        <h1 className="text-2xl font-bold">심방 신청</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          희망 시간을 최대 3개까지 적어주시면 목사님이 확인 후 확정해드려요.
        </p>
      </header>
      <VisitRequestForm
        selfMemberId={session.memberId}
        proxyMembers={canProxy ? members : null}
      />
    </div>
  );
}
