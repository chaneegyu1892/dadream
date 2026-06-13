import Link from 'next/link';
import type { CellSummary } from '@/lib/dashboard-query';

interface CellOverviewGridProps {
  cells: CellSummary[];
}

const MEMBER_PREVIEW_LIMIT = 6;

export function CellOverviewGrid({ cells }: CellOverviewGridProps) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-xs text-muted-foreground sm:text-sm">
        <span>셀을 누르면 해당 셀 명단을 볼 수 있어요.</span>
        <span>{cells.length}개 그룹</span>
      </div>

      <div className="grid grid-cols-2 gap-2">
        {cells.map((cell) => {
          const href = cell.id ? `/members?cell=${cell.id}` : '/members?cell=unassigned';
          const leaders = cell.leaderNames.length > 0 ? cell.leaderNames.join(', ') : '미지정';
          const visibleMembers = cell.memberNames.slice(0, MEMBER_PREVIEW_LIMIT);
          const hiddenMemberCount = cell.memberNames.length - visibleMembers.length;

          return (
            <Link
              key={cell.id ?? 'unassigned'}
              href={href}
              prefetch={false}
              className="block rounded-lg border bg-card p-2 text-card-foreground shadow-sm transition-colors hover:bg-accent/50 sm:p-3"
            >
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="text-sm font-semibold leading-tight sm:text-base">{cell.name}</p>
                  <p className="mt-0.5 text-xs text-muted-foreground">총 {cell.memberCount}명</p>
                </div>
                <span className="shrink-0 text-xs text-muted-foreground">보기 →</span>
              </div>

              <div className="mt-2 space-y-1 text-xs">
                <p className="flex items-baseline gap-1.5">
                  <span className="shrink-0 font-medium text-muted-foreground">셀리더</span>
                  <span className="min-w-0 truncate font-medium">{leaders}</span>
                </p>

                {cell.memberNames.length > 0 && (
                  <ul className="flex flex-wrap gap-x-1.5 gap-y-0.5 text-muted-foreground">
                    {visibleMembers.map((name, index) => (
                      <li key={`${name}-${index}`} className="leading-snug">
                        {name}
                      </li>
                    ))}
                    {hiddenMemberCount > 0 && (
                      <li className="font-medium leading-snug text-foreground/80">+{hiddenMemberCount}명</li>
                    )}
                  </ul>
                )}
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
