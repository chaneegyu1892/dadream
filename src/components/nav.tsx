'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { roleAtLeast, type UserRole } from '@/lib/roles';

const NAV_ITEMS = [
  { href: '/', label: '홈', icon: '🏠' },
  { href: '/visits', label: '캘린더', icon: '📅' },
  { href: '/members', label: '명부', icon: '👥' },
  { href: '/admin/approvals', label: '관리', icon: '⚙️', minRole: 'officer' as UserRole },
];

export function Nav({ role }: { role: UserRole }) {
  const pathname = usePathname();
  const items = NAV_ITEMS.filter((item) => !item.minRole || roleAtLeast(role, item.minRole));

  function isActive(href: string) {
    return href === '/' ? pathname === '/' : pathname.startsWith(href);
  }

  return (
    <>
      {/* 모바일: 하단 탭바 */}
      <nav className="fixed inset-x-0 bottom-0 z-50 flex border-t bg-background md:hidden">
        {items.map((item) => (
          <Link
            key={item.href}
            href={item.href}
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
