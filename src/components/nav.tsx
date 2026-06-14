'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { roleAtLeast, type UserRole } from '@/lib/roles';

const NAV_ITEMS: {
  href: string;
  label: string;
  icon: string;
  minRole?: UserRole;
  desktopOnly?: boolean;
  // longPrefetch: 무겁고 자주 안 바뀌는 상위 화면을 `prefetch={true}`로 완전히 prefetch해서
  //   next.config.ts의 staleTimes.static(12h) 동안 클라이언트 라우터 캐시에 보존시킨다.
  //   → 화면 간 이동이 즉시 뜬다. (자주 바뀌거나 권한 민감한 /me·/admin 등에는 켜지 않는다.)
  longPrefetch?: boolean;
}[] = [
  { href: '/', label: '홈', icon: '🏠' },
  { href: '/visits', label: '캘린더', icon: '📅', longPrefetch: true },
  { href: '/members', label: '명부', icon: '👥', longPrefetch: true },
  { href: '/service', label: '예배위원', icon: '🙏' },
  { href: '/me', label: '내 정보', icon: '🙋', desktopOnly: true },
  { href: '/admin', label: '관리', icon: '⚙️', minRole: 'officer' as UserRole },
];

export function Nav({ role }: { role: UserRole }) {
  const pathname = usePathname();
  const items = NAV_ITEMS.filter((item) => !item.minRole || roleAtLeast(role, item.minRole));
  // 모바일 하단 탭바는 핵심 항목만 유지 (6번째 탭으로 붐비지 않도록)
  const mobileItems = items.filter((item) => !item.desktopOnly);

  function isActive(href: string) {
    return href === '/' ? pathname === '/' : pathname.startsWith(href);
  }

  return (
    <>
      {/* 모바일: 하단 탭바 */}
      <nav className="fixed inset-x-0 bottom-0 z-50 flex border-t bg-background pb-[env(safe-area-inset-bottom)] md:hidden">
        {mobileItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            prefetch={item.longPrefetch || undefined}
            className={cn(
              'flex flex-1 flex-col items-center gap-0.5 py-2.5 text-xs',
              isActive(item.href) ? 'font-semibold text-foreground' : 'text-muted-foreground',
            )}
          >
            <span className="text-lg leading-none">{item.icon}</span>
            {item.label}
          </Link>
        ))}
      </nav>

      {/* 데스크톱: 사이드바 */}
      <aside className="hidden w-56 shrink-0 border-r md:block">
        <div className="sticky top-0 p-4">
          <p className="px-3 py-2 text-xs font-medium text-muted-foreground">제자광성교회 청년부</p>
          <p className="px-3 pb-4 text-xl font-bold">다드림</p>
          <div className="space-y-1">
            {items.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                prefetch={item.longPrefetch || undefined}
                className={cn(
                  'flex items-center gap-2.5 rounded-md px-3 py-2 text-sm',
                  isActive(item.href)
                    ? 'bg-accent font-semibold text-accent-foreground'
                    : 'text-muted-foreground hover:bg-accent/50',
                )}
              >
                <span>{item.icon}</span>
                {item.label}
              </Link>
            ))}
          </div>
        </div>
      </aside>
    </>
  );
}
