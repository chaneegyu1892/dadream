import Link from 'next/link';
import { getSessionProfile } from '@/lib/auth';
import { roleAtLeast } from '@/lib/roles';
import { getSignedPhotoUrls } from '@/lib/photos';
import { createClient } from '@/lib/supabase/server';
import { MemberGrid } from '@/components/member-grid';
import { Button } from '@/components/ui/button';
import type { CellRow, MemberRow } from '@/types/db';

export default async function MembersPage() {
  const session = await getSessionProfile();
  const supabase = await createClient();

  const [membersRes, cellsRes] = await Promise.all([
    supabase
      .from('members')
      .select('id, name, photo_path, cell_id, duty, is_officer, active')
      .eq('active', true)
      .order('name'),
    supabase.from('cells').select('id, name, sort_order').order('sort_order'),
  ]);

  const members = (membersRes.data ?? []) as MemberRow[];
  const cells = (cellsRes.data ?? []) as CellRow[];
  const photoUrls = await getSignedPhotoUrls(
    members.map((m) => m.photo_path).filter((p): p is string => Boolean(p)),
  );
  const cellNames = new Map(cells.map((c) => [c.id, c.name]));
  const canManage = session ? roleAtLeast(session.role, 'officer') : false;

  return (
    <div className="mx-auto max-w-5xl space-y-5">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">청년 명부</h1>
          <p className="mt-1 text-sm text-muted-foreground">총 {members.length}명</p>
        </div>
        {canManage && (
          <Button asChild size="sm">
            <Link href="/members/new">청년 추가</Link>
          </Button>
        )}
      </header>

      <MemberGrid
        members={members.map((m) => ({
          id: m.id,
          name: m.name,
          photoUrl: m.photo_path ? (photoUrls.get(m.photo_path) ?? null) : null,
          cellId: m.cell_id,
          cellName: m.cell_id ? (cellNames.get(m.cell_id) ?? null) : null,
          duty: m.duty,
          isOfficer: m.is_officer,
        }))}
        cells={cells.map((c) => ({ id: c.id, name: c.name }))}
      />
    </div>
  );
}
