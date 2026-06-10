import { redirect } from 'next/navigation';
import { getSessionProfile } from '@/lib/auth';
import { LogoutButton } from '@/components/logout-button';

export default async function PendingPage() {
  const profile = await getSessionProfile();

  if (!profile) redirect('/login');
  if (profile.approval === 'approved') redirect('/');

  const rejected = profile.approval === 'rejected';

  return (
    <main className="flex min-h-dvh flex-col items-center justify-center gap-6 px-6 text-center">
      <div className="text-5xl">{rejected ? '🙏' : '⏳'}</div>
      <div>
        <h1 className="text-xl font-bold">
          {rejected ? '가입이 승인되지 않았어요' : '가입 요청이 접수되었어요'}
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          {rejected
            ? '문의 사항은 청년부 임원에게 연락해주세요.'
            : '임원 승인 후 이용할 수 있어요. 조금만 기다려주세요!'}
        </p>
      </div>
      <LogoutButton />
    </main>
  );
}
