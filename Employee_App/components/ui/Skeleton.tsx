import { cn } from "@/lib/utils";

export function Skeleton({ className }: { className?: string }) {
  return <div className={cn("skeleton rounded-lg", className)} />;
}

export function CardSkeleton() {
  return (
    <div className="rounded-2xl bg-white p-4 shadow-card ring-1 ring-wuerth-line/70">
      <Skeleton className="h-4 w-2/3" />
      <Skeleton className="mt-3 h-3 w-1/2" />
      <Skeleton className="mt-2 h-3 w-1/3" />
    </div>
  );
}

export function ListSkeleton({ rows = 4 }: { rows?: number }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: rows }).map((_, i) => (
        <CardSkeleton key={i} />
      ))}
    </div>
  );
}
