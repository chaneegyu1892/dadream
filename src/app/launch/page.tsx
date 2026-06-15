import { LaunchRedirect } from '@/app/launch/launch-redirect';

export const metadata = {
  title: '다드림 불러오는 중...',
};

export default function LaunchPage() {
  return (
    <main className="flex min-h-dvh flex-col items-center justify-center bg-white px-6 text-center text-neutral-900">
      <div className="relative flex size-28 items-center justify-center sm:size-32" aria-hidden="true">
        <div className="absolute inset-0 rounded-[2rem] bg-pink-500/10 blur-2xl" />
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/icons/icon-512.png"
          alt=""
          width="112"
          height="112"
          className="relative size-24 rounded-[1.35rem] shadow-lg shadow-pink-500/10 sm:size-28"
          fetchPriority="high"
        />
      </div>
      <p className="mt-4 text-sm font-medium text-neutral-500">다드림 불러오는 중...</p>
      <LaunchRedirect />
    </main>
  );
}
