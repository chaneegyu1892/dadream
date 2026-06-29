import { cn } from '@/lib/utils';

/** 콘텐츠 도착 전 자리를 잡아 레이아웃 시프트를 막는 회색 플레이스홀더. */
function Skeleton({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot="skeleton"
      className={cn('animate-pulse rounded-md bg-muted', className)}
      {...props}
    />
  );
}

export { Skeleton };
