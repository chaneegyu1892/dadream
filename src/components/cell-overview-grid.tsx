import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
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

      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-6">
        {cells.map((cell) => {
          const href = cell.id ? `/members?cell=${cell.id}` : '/members?cell=unassigned';
          const leaders = cell.leaderNames.length > 0 ? cell.leaderNames.join(', ') : '미지정';

          return (
            <Link
              key={cell.id ?? 'unassigned'}
              href={href}
              prefetch={false}
              className="rounded-xl border bg-card p-3 text-card-foreground shadow-sm transition-colors hover:bg-accent/50"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="truncate font-semibold leading-tight">{cell.name}</p>
                  <p className="mt-1 text-xs text-muted-foreground">셀리더: {leaders}</p>
                </div>
                <Badge variant={cell.memberCount > 0 ? 'default' : 'secondary'} className="shrink-0">
                  {cell.memberCount}명
                </Badge>
              </div>

              <div className="mt-3 flex items-center justify-between text-xs text-muted-foreground">
                <span>임원 {cell.officerCount}명</span>
                <span>명단 보기 →</span>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
