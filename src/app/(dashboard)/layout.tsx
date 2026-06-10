import { redirect } from 'next/navigation';
import { getSessionProfile } from '@/lib/auth';
import { Nav } from '@/components/nav';

export default async function DashboardLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const profile = await getSessionProfile();

  if (!profile) redirect('/login');
  if (profile.approval !== 'approved') redirect('/pending');

  return (
    <div className="flex min-h-dvh flex-col md:flex-row">
      <Nav role={profile.role} />
      <main className="flex-1 px-4 pb-24 pt-6 md:px-8 md:pb-8">{children}</main>
    </div>
  );
}
