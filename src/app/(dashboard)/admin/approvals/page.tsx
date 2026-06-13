import { redirect } from 'next/navigation';
import { getSessionProfile } from '@/lib/auth';
import { roleAtLeast } from '@/lib/roles';
import { matchCandidates } from '@/lib/matching';
import { createClient } from '@/lib/supabase/server';
import { ApprovalCard } from '@/components/approval-card';
import type { CellRow, MemberRow, ProfileRow } from '@/types/db';

type ApprovalMemberRow = Pick<MemberRow, 'id' | 'name' | 'cell_id'>;

export default async function ApprovalsPage() {
  const session = await getSessionProfile();
  if (!session || !roleAtLeast(session.role, 'officer')) redirect('/');

  const supabase = await createClient();
  const [pendingRes, membersRes, profilesRes, cellsRes] = await Promise.all([
    supabase
      .from('profiles')
      .select('id, kakao_nickname, approval, created_at, member_id, role')
      .eq('approval', 'pending')
      .order('created_at'),
    supabase.from('members').select('id, name, cell_id').eq('active', true).order('name'),
    supabase.from('profiles').select('member_id').not('member_id', 'is', null),
    supabase.from('cells').select('id, name, sort_order').order('sort_order'),
  ]);

  const pending = (pendingRes.data ?? []) as ProfileRow[];
  const members = (membersRes.data ?? []) as ApprovalMemberRow[];
  const cells = (cellsRes.data ?? []) as CellRow[];
  const linkedIds = new Set((profilesRes.data ?? []).map((p) => p.member_id));
  const unlinked = members.filter((m) => !linkedIds.has(m.id));
  const cellNames = new Map(cells.map((c) => [c.id, c.name]));

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <header>
        <h1 className="text-2xl font-bold">가입 승인</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          새로 가입한 청년을 명부와 연결하고 승인해주세요.
        </p>
      </header>

      {pending.length === 0 ? (
        <p className="rounded-lg border border-dashed p-8 text-center text-sm text-muted-foreground">
          대기 중인 가입 요청이 없어요.
        </p>
      ) : (
        <div className="space-y-4">
          {pending.map((profile) => (
            <ApprovalCard
              key={profile.id}
              profile={{
                id: profile.id,
                kakaoNickname: profile.kakao_nickname ?? '(이름 없음)',
                createdAt: profile.created_at,
              }}
              candidates={matchCandidates(profile.kakao_nickname ?? '', unlinked).map((m) => ({
                id: m.id,
                name: m.name,
                cellName: m.cell_id ? (cellNames.get(m.cell_id) ?? null) : null,
              }))}
              allUnlinked={unlinked.map((m) => ({
                id: m.id,
                name: m.name,
                cellName: m.cell_id ? (cellNames.get(m.cell_id) ?? null) : null,
              }))}
              cells={cells.map((c) => ({ id: c.id, name: c.name }))}
            />
          ))}
        </div>
      )}
    </div>
  );
}
