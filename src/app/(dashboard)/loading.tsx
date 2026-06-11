export default function DashboardLoading() {
  return (
    <div className="mx-auto max-w-3xl space-y-6" aria-label="페이지를 불러오는 중">
      <div className="space-y-2">
        <div className="h-7 w-32 animate-pulse rounded-md bg-muted" />
        <div className="h-4 w-56 animate-pulse rounded-md bg-muted" />
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="h-10 animate-pulse rounded-md bg-muted" />
        <div className="h-10 animate-pulse rounded-md bg-muted" />
      </div>
      {[0, 1, 2].map((item) => (
        <div key={item} className="rounded-xl border p-4">
          <div className="mb-4 h-5 w-28 animate-pulse rounded-md bg-muted" />
          <div className="space-y-2">
            <div className="h-4 animate-pulse rounded-md bg-muted" />
            <div className="h-4 w-2/3 animate-pulse rounded-md bg-muted" />
          </div>
        </div>
      ))}
    </div>
  );
}
