import { redirect } from 'next/navigation';
import { getSessionProfile } from '@/lib/auth';
import { roleAtLeast } from '@/lib/roles';
import { createClient } from '@/lib/supabase/server';
import { WeddingList } from '@/components/wedding-list';

export default async function WeddingsPage() {
  const session = await getSessionProfile();
  if (!session || !roleAtLeast(session.role, 'officer')) redirect('/');

  const supabase = await createClient();
  const [weddingsRes, membersRes] = await Promise.all([
    supabase
      .from('wedding_plans')
      .select('id, member_id, partner_name, wedding_date, venue, note, members(name, cells(name))')
      .order('wedding_date', { ascending: true, nullsFirst: false }),
    supabase.from('members').select('id, name').eq('active', true).order('name'),
  ]);

  const weddings = weddingsRes.data ?? [];

  return (
    <div className="mx-auto max-w-2xl space-y-5">
      <header>
        <h1 className="text-2xl font-bold">결혼 예정</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          결혼을 앞둔 청년들을 D-day순으로 관리해요.
        </p>
      </header>

      <WeddingList
        weddings={weddings.map((w) => ({
          id: w.id,
          memberName: w.members?.name ?? '',
          cellName: w.members?.cells?.name ?? null,
          partnerName: w.partner_name,
          weddingDate: w.wedding_date,
          venue: w.venue,
          note: w.note,
        }))}
        members={membersRes.data ?? []}
      />
    </div>
  );
}
