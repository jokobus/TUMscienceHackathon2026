import { ReactNode } from "react";

/** Empty state — every list must render one, never a blank screen (Master §4). */
export function EmptyState({
  title,
  hint,
}: {
  title: string;
  hint?: string;
  icon?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-start gap-2 px-2 py-10">
      <div className="we-line mb-2" />
      <p className="font-display text-base text-we-ink">{title}</p>
      {hint && <p className="max-w-sm text-[13px] leading-relaxed text-we-muted">{hint}</p>}
    </div>
  );
}

export function Skeleton({ className = "" }: { className?: string }) {
  return <div className={`skeleton ${className}`} />;
}

export function SkeletonCard({ rows = 3 }: { rows?: number }) {
  return (
    <div className="space-y-3 rounded-card border border-we-line bg-we-surface p-6">
      <Skeleton className="h-4 w-1/3" />
      {Array.from({ length: rows }).map((_, i) => (
        <Skeleton key={i} className="h-3 w-full" />
      ))}
    </div>
  );
}

export function ErrorState({ message }: { message: string }) {
  return (
    <div className="rounded-card border-l-2 border-we-red bg-status-risk-soft px-5 py-4 text-sm text-status-risk">
      {message}
    </div>
  );
}
