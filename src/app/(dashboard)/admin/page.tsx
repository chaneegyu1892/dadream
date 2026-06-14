import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getSessionProfile } from '@/lib/auth';
import { roleAtLeast } from '@/lib/roles';
import { createClient } from '@/lib/supabase/server';
import { DashboardSyncButton } from '@/components/dashboard-sync-button';
import { Badge } from '@/components/ui/badge';

export default async function AdminPage() {
  const session = await getSessionProfile();
  if (!session || !roleAtLeast(session.role, 'officer')) redirect('/');

  const supabase = await createClient();
  const { count: pendingCount } = await supabase
    .from('profiles')
    .select('*', { count: 'exact', head: true })
    .eq('approval', 'pending');

  const menus = [
    {
      href: '/admin/approvals',
      icon: '✅',
      title: '가입 승인',
      description: '새로 가입한 청년을 명부와 연결해요',
      badge: pendingCount || 0,
    },
    {
      href: '/admin/meetings',
      icon: '📋',
      title: '임원회의 체크리스트',
      description: '회의 안건과 할 일을 관리해요',
      badge: 0,
    },
    {
      href: '/admin/weddings',
      icon: '💍',
      title: '결혼 예정',
      description: '결혼을 앞둔 청년들을 관리해요',
      badge: 0,
    },
    {
      href: '/members/new',
      icon: '👤',
      title: '청년 추가',
      description: '명부에 새 청년을 등록해요',
      badge: 0,
    },
    {
      href: '/admin/member-duties',
      icon: '🏷️',
      title: '직책 관리',
      description: '명부 수정 화면의 직책 선택지를 관리해요',
      badge: 0,
    },
  ];

  return (
    <div className="mx-auto max-w-2xl space-y-5">
      <header>
        <h1 className="text-2xl font-bold">관리</h1>
        <p className="mt-1 text-sm text-muted-foreground">임원 이상만 볼 수 있는 메뉴예요.</p>
      </header>

      <DashboardSyncButton />

      <div className="space-y-2">
        {menus.map((menu) => (
          <Link
            key={menu.href}
            href={menu.href}
            className="flex items-center gap-3 rounded-xl border px-4 py-3.5 transition-colors hover:bg-accent/50"
          >
            <span className="text-2xl">{menu.icon}</span>
            <div className="flex-1">
              <p className="font-medium">{menu.title}</p>
              <p className="text-xs text-muted-foreground">{menu.description}</p>
            </div>
            {menu.badge > 0 && <Badge>{menu.badge}</Badge>}
          </Link>
        ))}
      </div>
    </div>
  );
}
