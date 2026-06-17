import { redirect } from 'next/navigation';
import { getSessionProfile } from '@/lib/auth';
import { createClient } from '@/lib/supabase/server';
import { SelfProfileForm } from '@/components/self-profile-form';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default async function MyProfilePage() {
  const session = await getSessionProfile();
  if (!session) redirect('/login');

  // 승인은 됐지만 아직 명부에 연결되지 않은 경우: 안전한 안내 상태
  if (!session.memberId) {
    return (
      <div className="mx-auto max-w-2xl space-y-5">
        <header>
          <h1 className="text-2xl font-bold">내 정보</h1>
        </header>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">명부 연결이 필요해요</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            아직 계정이 청년부 명부와 연결되지 않았어요. 임원에게 문의하면 명부에 연결해 드려요.
            연결되면 이 화면에서 직접 정보를 수정할 수 있어요.
          </CardContent>
        </Card>
      </div>
    );
  }

  const memberId = session.memberId;
  const supabase = await createClient();

  const [memberRes, contactRes, privateRes] = await Promise.all([
    supabase
      .from('members')
      .select('id, name, duty, is_officer, cells(name)')
      .eq('id', memberId)
      .maybeSingle(),
    supabase
      .from('member_contact')
      .select('phone, birth_date, baptized')
      .eq('member_id', memberId)
      .maybeSingle(),
    supabase
      .from('member_private')
      .select('address, workplace, family_info')
      .eq('member_id', memberId)
      .maybeSingle(),
  ]);

  const member = memberRes.data;
  const contact = contactRes.data;
  const priv = privateRes.data;

  return (
    <div className="mx-auto max-w-2xl space-y-5">
      <header className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">내 정보</h1>
      </header>

      {member && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">기본 정보</CardTitle>
          </CardHeader>
          <CardContent className="space-y-1.5 text-sm">
            <div className="flex justify-between gap-4">
              <span className="shrink-0 text-muted-foreground">이름</span>
              <span className="text-right">{member.name}</span>
            </div>
            <div className="flex items-center justify-between gap-4">
              <span className="shrink-0 text-muted-foreground">셀</span>
              <span className="flex items-center gap-2 text-right">
                {member.cells?.name ?? '무소속'}
                {member.duty && <span>· {member.duty}</span>}
                {member.is_officer && <Badge variant="secondary">임원</Badge>}
              </span>
            </div>
            <p className="pt-1 text-xs text-muted-foreground">
              이름·셀·직분은 본인이 바꿀 수 없어요. 변경이 필요하면 임원에게 문의해주세요.
            </p>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="text-base">내 정보 수정</CardTitle>
        </CardHeader>
        <CardContent>
          <SelfProfileForm
            initial={{
              phone: contact?.phone ?? '',
              birthDate: contact?.birth_date ?? '',
              baptized:
                contact?.baptized === null || contact?.baptized === undefined
                  ? 'unknown'
                  : contact.baptized
                    ? 'true'
                    : 'false',
              address: priv?.address ?? '',
              workplace: priv?.workplace ?? '',
              familyInfo: priv?.family_info ?? '',
            }}
          />
        </CardContent>
      </Card>
    </div>
  );
}
