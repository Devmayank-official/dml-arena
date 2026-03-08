import { Skeleton } from '@/components/ui/skeleton';

export function PageSkeleton() {
  return (
    <div className="flex min-h-screen w-full flex-col items-center justify-start gap-6 p-6 pt-20">
      <Skeleton className="h-10 w-64" />
      <Skeleton className="h-6 w-96" />
      <div className="grid w-full max-w-6xl grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-48 w-full rounded-xl" />
        ))}
      </div>
    </div>
  );
}

export function LandingSkeleton() {
  return (
    <div className="flex min-h-screen w-full flex-col items-center justify-center gap-8 p-6">
      <Skeleton className="h-14 w-80" />
      <Skeleton className="h-6 w-[500px]" />
      <Skeleton className="h-12 w-48 rounded-full" />
    </div>
  );
}
