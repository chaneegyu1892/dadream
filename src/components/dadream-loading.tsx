import Image from 'next/image';

type DadreamLoadingProps = {
  message?: string;
};

export function DadreamLoading({ message = '다드림 불러오는 중...' }: DadreamLoadingProps) {
  return (
    <div
      className="flex min-h-[55vh] flex-col items-center justify-center gap-4 text-center"
      aria-label="페이지를 불러오는 중"
      role="status"
    >
      <div className="relative flex size-28 items-center justify-center sm:size-32">
        <div className="absolute inset-0 rounded-[2rem] bg-pink-500/10 blur-2xl" aria-hidden="true" />
        <Image
          src="/icons/icon-512.png"
          alt="다드림"
          width={112}
          height={112}
          priority
          className="dadream-loading-logo relative size-24 rounded-[1.35rem] shadow-lg shadow-pink-500/10 sm:size-28"
        />
      </div>
      <p className="text-sm font-medium text-muted-foreground">{message}</p>
    </div>
  );
}
