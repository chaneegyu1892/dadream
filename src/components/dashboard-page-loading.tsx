import { cn } from '@/lib/utils';

type SkeletonProps = {
  className?: string;
};

type PageHeaderSkeletonProps = {
  className?: string;
  actions?: number;
};

type CardListSkeletonProps = {
  count?: number;
  rows?: number;
  className?: string;
};

function Skeleton({ className }: SkeletonProps) {
  return <div className={cn('animate-pulse rounded-md bg-muted', className)} />;
}

function PageHeaderSkeleton({ className, actions = 0 }: PageHeaderSkeletonProps) {
  return (
    <header className={cn('flex items-start justify-between gap-4', className)}>
      <div className="min-w-0 flex-1 space-y-2">
        <Skeleton className="h-8 w-32" />
        <Skeleton className="h-4 w-full max-w-sm" />
      </div>
      {actions > 0 && (
        <div className="flex shrink-0 gap-2">
          {Array.from({ length: actions }, (_, index) => (
            <Skeleton key={index} className="h-9 w-20 rounded-md" />
          ))}
        </div>
      )}
    </header>
  );
}

function CardSkeleton({ rows = 3, className }: { rows?: number; className?: string }) {
  return (
    <div className={cn('rounded-xl border bg-card p-5 shadow-sm', className)}>
      <Skeleton className="h-5 w-28" />
      <div className="mt-5 space-y-3">
        {Array.from({ length: rows }, (_, index) => (
          <div key={index} className="flex items-center justify-between gap-4">
            <Skeleton className={cn('h-4', index % 2 === 0 ? 'w-3/5' : 'w-2/5')} />
            <Skeleton className="h-4 w-16" />
          </div>
        ))}
      </div>
    </div>
  );
}

function CardListSkeleton({ count = 3, rows = 2, className }: CardListSkeletonProps) {
  return (
    <div className={cn('space-y-3', className)}>
      {Array.from({ length: count }, (_, index) => (
        <CardSkeleton key={index} rows={rows} />
      ))}
    </div>
  );
}

function ListItemSkeleton({ className }: SkeletonProps) {
  return (
    <div className={cn('flex items-center justify-between gap-4 rounded-xl border px-4 py-3.5', className)}>
      <div className="flex min-w-0 flex-1 items-center gap-3">
        <Skeleton className="size-9 rounded-full" />
        <div className="min-w-0 flex-1 space-y-2">
          <Skeleton className="h-4 w-2/5" />
          <Skeleton className="h-3 w-3/5" />
        </div>
      </div>
      <Skeleton className="h-6 w-14 rounded-full" />
    </div>
  );
}

function MenuCardSkeleton() {
  return (
    <div className="flex items-center gap-3 rounded-xl border px-4 py-3.5">
      <Skeleton className="size-9 rounded-lg" />
      <div className="min-w-0 flex-1 space-y-2">
        <Skeleton className="h-4 w-28" />
        <Skeleton className="h-3 w-48 max-w-full" />
      </div>
      <Skeleton className="h-6 w-8 rounded-full" />
    </div>
  );
}

export function MembersPageLoading() {
  return (
    <div className="mx-auto max-w-6xl space-y-5" role="status" aria-busy="true" aria-label="청년 명부를 불러오는 중">
      <PageHeaderSkeleton actions={1} />
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 9 }, (_, index) => (
          <div key={index} className="rounded-xl border bg-card p-4 shadow-sm">
            <div className="flex items-center justify-between gap-3">
              <Skeleton className="h-5 w-24" />
              <Skeleton className="h-6 w-12 rounded-full" />
            </div>
            <div className="mt-4 space-y-2">
              <Skeleton className="h-3 w-4/5" />
              <Skeleton className="h-3 w-3/5" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function MemberDetailLoading() {
  return (
    <div className="mx-auto max-w-2xl space-y-5" role="status" aria-busy="true" aria-label="청년 정보를 불러오는 중">
      <header className="flex items-center gap-4">
        <Skeleton className="size-20 rounded-full" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-7 w-32" />
          <Skeleton className="h-4 w-48" />
        </div>
      </header>
      <CardSkeleton rows={3} />
      <CardSkeleton rows={3} />
    </div>
  );
}

export function VisitsPageLoading() {
  return (
    <div className="mx-auto max-w-3xl space-y-6" role="status" aria-busy="true" aria-label="심방 일정을 불러오는 중">
      <PageHeaderSkeleton actions={2} />
      <div className="rounded-xl border bg-card p-4 shadow-sm">
        <div className="mb-4 flex items-center justify-between">
          <Skeleton className="h-6 w-32" />
          <div className="flex gap-2">
            <Skeleton className="size-8 rounded-md" />
            <Skeleton className="size-8 rounded-md" />
          </div>
        </div>
        <div className="grid grid-cols-7 gap-1.5">
          {Array.from({ length: 42 }, (_, index) => (
            <Skeleton key={index} className="aspect-square rounded-lg" />
          ))}
        </div>
      </div>
      <CardListSkeleton count={2} rows={3} />
    </div>
  );
}

export function ServicePageLoading() {
  return (
    <div className="mx-auto max-w-2xl space-y-5" role="status" aria-busy="true" aria-label="예배위원 배정표를 불러오는 중">
      <PageHeaderSkeleton />
      <CardSkeleton rows={2} />
      <CardListSkeleton count={5} rows={1} />
    </div>
  );
}

export function AdminMenuLoading() {
  return (
    <div className="mx-auto max-w-2xl space-y-5" role="status" aria-busy="true" aria-label="관리 메뉴를 불러오는 중">
      <PageHeaderSkeleton />
      <div className="space-y-2">
        {Array.from({ length: 4 }, (_, index) => (
          <MenuCardSkeleton key={index} />
        ))}
      </div>
    </div>
  );
}

export function AdminListLoading({ label = '관리 목록을 불러오는 중' }: { label?: string }) {
  return (
    <div className="mx-auto max-w-2xl space-y-5" role="status" aria-busy="true" aria-label={label}>
      <PageHeaderSkeleton actions={1} />
      <div className="space-y-2">
        {Array.from({ length: 5 }, (_, index) => (
          <ListItemSkeleton key={index} />
        ))}
      </div>
    </div>
  );
}

export function FormPageLoading({ label = '입력 화면을 불러오는 중' }: { label?: string }) {
  return (
    <div className="mx-auto max-w-lg space-y-5" role="status" aria-busy="true" aria-label={label}>
      <PageHeaderSkeleton />
      <div className="rounded-xl border bg-card p-5 shadow-sm">
        <div className="space-y-4">
          {Array.from({ length: 5 }, (_, index) => (
            <div key={index} className="space-y-2">
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-10 w-full rounded-md" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export function MeetingDetailLoading() {
  return (
    <div className="mx-auto max-w-2xl space-y-5" role="status" aria-busy="true" aria-label="회의 체크리스트를 불러오는 중">
      <PageHeaderSkeleton />
      <CardListSkeleton count={6} rows={1} />
    </div>
  );
}
