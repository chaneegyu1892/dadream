import { notFound, redirect } from 'next/navigation';
import { getSessionProfile } from '@/lib/auth';
import { visibleFields } from '@/lib/roles';
import { VISIT_STATUS_LABELS } from '@/lib/visits';
import { getSignedPhotoUrls } from '@/lib/photos';
import { createClient } from '@/lib/supabase/server';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { MemberContactRow, MemberPrivateRow, MemberRow, VisitRow } from '@/types/db';

interface MemberDetailPageProps {
  params: Promise<{ id: string }>;
}

export default async function MemberDetailPage({ params }: MemberDetailPageProps) {
  const { id } = await params;
  const session = await getSessionProfile();
  if (!session) redirect('/login');

  const supabase = await createClient();
  const { data: memberData } = await supabase
    .from('members')
    .select('id, name, photo_path, cell_id, duty, is_officer, active, cells(name)')
    .eq('id', id)
    .single();

  if (!memberData) notFound();
  const member = memberData as unknown as MemberRow & { cells: { name: string } | null };

  const isSelf = session.memberId === id;
  const fields = visibleFields(session.role, isSelf);
  const showContact = fields.includes('phone');
  const showPrivate = fields.includes('address');

  // RLS가 최종 방어선이므로 조회 실패는 권한 없음으로 간주하고 조용히 생략
  const [contactRes, privateRes, visitsRes] = await Promise.all([
    showContact
      ? supabase.from('member_contact').select('member_id, phone, birth_date, baptized').eq('member_id', id).maybeSingle()
      : Promise.resolve({ data: null }),
    showPrivate
      ? supabase.from('member_private').select('member_id, address, workplace, family_info').eq('member_id', id).maybeSingle()
      : Promise.resolve({ data: null }),
    showPrivate
      ? supabase
          .from('visit_requests')
          .select('id, member_id, requested_by, preferred_slots, message, status, proposed_slot, confirmed_at, decline_reason, created_at')
          .eq('member_id', id)
          .order('created_at', { ascending: false })
          .limit(12)
      : Promise.resolve({ data: null }),
  ]);

  const contact = contactRes.data as MemberContactRow | null;
  const priv = privateRes.data as MemberPrivateRow | null;
  const visits = (visitsRes.data ?? []) as VisitRow[];
  const photoUrls = member.photo_path ? await getSignedPhotoUrls([member.photo_path]) : new Map<string, string>();
  const photoUrl = member.photo_path ? (photoUrls.get(member.photo_path) ?? null) : null;

  return (
    <div className="mx-auto max-w-2xl space-y-5">
      <header className="flex items-center gap-4">
        <Avatar className="size-20">
          {photoUrl && <AvatarImage src={photoUrl} alt={member.name} />}
          <AvatarFallback className="text-2xl">{member.name.slice(0, 2)}</AvatarFallback>
        </Avatar>
        <div>
          <h1 className="text-2xl font-bold">{member.name}</h1>
          <div className="mt-1 flex items-center gap-2 text-sm text-muted-foreground">
            <span>{member.cells?.name ?? '무소속'}</span>
            {member.duty && <span>· {member.duty}</span>}
            {member.is_officer && <Badge variant="secondary">임원</Badge>}
          </div>
        </div>
      </header>

      {showContact && contact && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">연락처 정보</CardTitle>
          </CardHeader>
          <CardContent className="space-y-1.5 text-sm">
            <InfoRow label="전화번호" value={contact.phone} />
            <InfoRow label="생년월일" value={contact.birth_date} />
            <InfoRow
              label="세례"
              value={contact.baptized === null ? null : contact.baptized ? '받음' : '안 받음'}
            />
          </CardContent>
        </Card>
      )}

      {showPrivate && priv && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">상세 정보</CardTitle>
          </CardHeader>
          <CardContent className="space-y-1.5 text-sm">
            <InfoRow label="주소" value={priv.address} />
            <InfoRow label="직장" value={priv.workplace} />
            <InfoRow label="가족" value={priv.family_info} />
          </CardContent>
        </Card>
      )}

      {showPrivate && visits.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">심방 이력</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            {visits.map((v) => (
              <div key={v.id} className="flex items-center justify-between">
                <span>{new Date(v.created_at).toLocaleDateString('ko-KR')}</span>
                <Badge variant="outline">{VISIT_STATUS_LABELS[v.status]}</Badge>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: string | null }) {
  return (
    <div className="flex justify-between gap-4">
      <span className="shrink-0 text-muted-foreground">{label}</span>
      <span className="text-right">{value ?? '—'}</span>
    </div>
  );
}
