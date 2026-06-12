import { redirect } from 'next/navigation';
import { getSessionProfile } from '@/lib/auth';
import { roleAtLeast } from '@/lib/roles';

/**
 * /admin 하위 전체에 대한 중앙 권한 가드.
 * 개별 페이지의 자체 검사를 빠뜨려도 officer 미만은 여기서 차단된다.
 */
export default async function AdminLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const profile = await getSessionProfile();
  if (!profile || !roleAtLeast(profile.role, 'officer')) {
    redirect('/');
  }
  return <>{children}</>;
}
