import { getSessionProfile } from '@/lib/auth';
import { ROLE_LABELS } from '@/lib/roles';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default async function HomePage() {
  const profile = await getSessionProfile();

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <header>
        <h1 className="text-2xl font-bold">다드림 대시보드</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {profile ? `${ROLE_LABELS[profile.role]}으로 로그인했어요.` : ''}
        </p>
      </header>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">다가오는 일정</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">
          아직 등록된 일정이 없어요.
        </CardContent>
      </Card>
    </div>
  );
}
