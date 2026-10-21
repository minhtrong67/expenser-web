export function Skeleton({ className = '' }) {
  return <div className={`skeleton rounded-lg ${className}`} />;
}

export function CardSkeleton() {
  return (
    <div className="rounded-2xl border border-line bg-card p-5">
      <Skeleton className="mb-3 h-4 w-24" />
      <Skeleton className="h-8 w-32" />
    </div>
  );
}

export function RowSkeleton() {
  return (
    <div className="flex items-center gap-3 px-4 py-3">
      <Skeleton className="h-10 w-10 rounded-full" />
      <div className="flex-1 space-y-2">
        <Skeleton className="h-3.5 w-1/3" />
        <Skeleton className="h-3 w-1/4" />
      </div>
      <Skeleton className="h-4 w-16" />
    </div>
  );
}

export function TableSkeleton({ rows = 6 }) {
  return (
    <div className="overflow-hidden rounded-2xl border border-line bg-card">
      {Array.from({ length: rows }).map((_, i) => (
        <RowSkeleton key={i} />
      ))}
    </div>
  );
}

export function ChartSkeleton() {
  return (
    <div className="rounded-2xl border border-line bg-card p-5">
      <Skeleton className="mb-4 h-4 w-40" />
      <Skeleton className="h-56 w-full" />
    </div>
  );
}

export function CalendarSkeleton() {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <CardSkeleton />
        <CardSkeleton />
      </div>
      <div className="rounded-2xl border border-line bg-card p-4">
        <div className="mb-4 flex items-center justify-between">
          <Skeleton className="h-4 w-28" />
          <Skeleton className="h-8 w-20" />
        </div>
        <div className="grid grid-cols-7 gap-1.5">
          {Array.from({ length: 35 }).map((_, i) => (
            <Skeleton key={i} className="aspect-square w-full" />
          ))}
        </div>
      </div>
    </div>
  );
}
