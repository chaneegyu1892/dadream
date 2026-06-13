import Link from 'next/link';
import type { CellSummary } from '@/lib/dashboard-query';

interface CellOverviewGridProps {
  cells: CellSummary[];
}

export function CellOverviewGrid({ cells }: CellOverviewGridProps) {
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between text-sm text-muted-foreground">
        <span>셀을 누르면 해당 셀 명단을 볼 수 있어요.</span>
        <span>{cells.length}개 그룹</span>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {cells.map((cell) => {
          const href = cell.id ? `/members?cell=${cell.id}` : '/members?cell=unassigned';
          const leaders = cell.leaderNames.length > 0 ? cell.leaderNames.join(', ') : '미지정';

          return (
            <Link
              key={cell.id ?? 'unassigned'}
              href={href}
              prefetch={false}
              className="block rounded-xl border bg-card p-4 text-card-foreground shadow-sm transition-colors hover:bg-accent/50"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-lg font-semibold leading-tight">{cell.name}</p>
                  <p className="mt-1 text-sm text-muted-foreground">총 {cell.memberCount}명</p>
                </div>
                <span className="text-xs text-muted-foreground">명단 보기 →</span>
              </div>

              <div className="mt-4 space-y-3 text-sm">
                <div>
                  <p className="text-xs font-medium text-muted-foreground">셀리더</p>
                  <p className="mt-1 font-medium">{leaders}</p>
                </div>

                <div>
                  <p className="text-xs font-medium text-muted-foreground">셀원</p>
                  {cell.memberNames.length > 0 ? (
                    <ul className="mt-2 flex flex-wrap gap-x-2 gap-y-1 text-muted-foreground">
                      {cell.memberNames.map((name, index) => (
                        <li key={`${name}-${index}`}>{name}</li>
                      ))}
                    </ul>
                  ) : (
                    <p className="mt-1 text-muted-foreground">셀원 없음</p>
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
