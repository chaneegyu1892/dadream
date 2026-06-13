import Link from 'next/link';
import type { CellSummary } from '@/lib/dashboard-query';

interface CellOverviewGridProps {
  cells: CellSummary[];
}

const MEMBER_PREVIEW_LIMIT = 8;

export function CellOverviewGrid({ cells }: CellOverviewGridProps) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-xs text-muted-foreground sm:text-sm">
        <span>셀을 누르면 해당 셀 명단을 볼 수 있어요.</span>
        <span>{cells.length}개 그룹</span>
      </div>

      <div className="grid gap-2 sm:grid-cols-2">
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
              className="block rounded-lg border bg-card p-3 text-card-foreground shadow-sm transition-colors hover:bg-accent/50"
            >
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="text-base font-semibold leading-tight">{cell.name}</p>
                  <p className="mt-0.5 text-xs text-muted-foreground">총 {cell.memberCount}명</p>
                </div>
                <span className="shrink-0 text-xs text-muted-foreground">보기 →</span>
              </div>

              <div className="mt-3 space-y-2 text-xs">
                <div>
                  <p className="font-medium text-muted-foreground">셀리더</p>
                  <p className="mt-0.5 truncate font-medium">{leaders}</p>
                </div>

                <div>
                  <p className="font-medium text-muted-foreground">셀원</p>
                  {cell.memberNames.length > 0 ? (
                    <ul className="mt-1 flex flex-wrap gap-x-1.5 gap-y-0.5 text-muted-foreground">
                      {visibleMembers.map((name, index) => (
                        <li key={`${name}-${index}`} className="leading-snug">
                          {name}
                        </li>
                      ))}
                      {hiddenMemberCount > 0 && (
                        <li className="font-medium leading-snug text-foreground/80">+{hiddenMemberCount}명</li>
                      )}
                    </ul>
                  ) : (
                    <p className="mt-0.5 text-muted-foreground">셀원 없음</p>
                  )}
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
