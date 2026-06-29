import { Skeleton } from '@/components/ui/skeleton';

/**
 * 라우트별 로딩 스켈레톤.
 * 실제 페이지와 같은 컨테이너 폭·간격·블록 형태를 미리 그려, 전환 시 로고가 깜빡이는 대신
 * "콘텐츠가 채워지는" 느낌을 주고 콘텐츠 도착 시 레이아웃 시프트를 줄인다.
 */

function PageHeaderSkeleton({ withAction = false }: { withAction?: boolean }) {
  return (
    <div className="flex items-start justify-between">
      <div className="space-y-2">
        <Skeleton className="h-7 w-32" />
        <Skeleton className="h-4 w-48" />
      </div>
      {withAction && <Skeleton className="h-8 w-20 shrink-0" />}
    </div>
  );
}

function CardSkeleton({ lines = 2 }: { lines?: number }) {
  return (
    <div className="space-y-3 rounded-xl border p-4">
      <Skeleton className="h-5 w-28" />
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton key={i} className="h-4 w-full" />
      ))}
    </div>
  );
}

export function HomePageSkeleton() {
  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div className="space-y-2">
        <Skeleton className="h-8 w-24" />
        <Skeleton className="h-4 w-64" />
      </div>
      <div className="flex gap-2">
        <Skeleton className="h-9 flex-1" />
        <Skeleton className="h-9 flex-1" />
        <Skeleton className="h-9 flex-1" />
      </div>
      {Array.from({ length: 3 }).map((_, i) => (
        <CardSkeleton key={i} lines={2} />
      ))}
    </div>
  );
}

export function MembersPageSkeleton() {
  return (
    <div className="mx-auto max-w-6xl space-y-5">
      <PageHeaderSkeleton withAction />
      <Skeleton className="h-10 w-full rounded-lg" />
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <Skeleton key={i} className="h-28 rounded-xl" />
        ))}
      </div>
    </div>
  );
}

export function VisitsPageSkeleton() {
  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <PageHeaderSkeleton withAction />
      <Skeleton className="h-72 w-full rounded-xl" />
      <div className="space-y-3">
        <Skeleton className="h-5 w-24" />
        <CardSkeleton lines={2} />
        <CardSkeleton lines={2} />
      </div>
    </div>
  );
}

export function ServicePageSkeleton() {
  return (
    <div className="mx-auto max-w-2xl space-y-5">
      <PageHeaderSkeleton />
      <Skeleton className="h-10 w-full rounded-lg" />
      <div className="space-y-2">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-14 w-full rounded-xl" />
        ))}
      </div>
    </div>
  );
}

export function AdminPageSkeleton() {
  return (
    <div className="mx-auto max-w-2xl space-y-5">
      <PageHeaderSkeleton />
      <Skeleton className="h-10 w-full rounded-md" />
      <div className="space-y-2">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-16 w-full rounded-xl" />
        ))}
      </div>
    </div>
  );
}

export function ListPageSkeleton() {
  return (
    <div className="mx-auto max-w-2xl space-y-5">
      <PageHeaderSkeleton withAction />
      <div className="space-y-2">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-16 w-full rounded-xl" />
        ))}
      </div>
    </div>
  );
}

export function FormPageSkeleton() {
  return (
    <div className="mx-auto max-w-2xl space-y-5">
      <PageHeaderSkeleton />
      <div className="space-y-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="space-y-2">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-10 w-full rounded-lg" />
          </div>
        ))}
        <Skeleton className="h-10 w-28 rounded-lg" />
      </div>
    </div>
  );
}
