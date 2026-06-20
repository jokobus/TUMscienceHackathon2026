import { ReactNode } from "react";

/** Empty state — every list must render one, never a blank screen (Master §4). */
export function EmptyState({
  title,
  hint,
  icon = "○",
}: {
  title: string;
  hint?: string;
  icon?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 px-6 py-12 text-center">
      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-we-canvas text-lg text-we-muted">
        {icon}
      </div>
      <p className="text-sm font-medium text-we-slate">{title}</p>
      {hint && <p className="max-w-sm text-xs text-we-muted">{hint}</p>}
    </div>
  );
}

export function Skeleton({ className = "" }: { className?: string }) {
  return <div className={`skeleton ${className}`} />;
}

export function SkeletonCard({ rows = 3 }: { rows?: number }) {
  return (
    <div className="space-y-3 rounded-card border border-we-line bg-we-surface p-5 shadow-card">
      <Skeleton className="h-4 w-1/3" />
      {Array.from({ length: rows }).map((_, i) => (
        <Skeleton key={i} className="h-3 w-full" />
      ))}
    </div>
  );
}

export function ErrorState({ message }: { message: string }) {
  return (
    <div className="rounded-card border border-status-risk-soft bg-status-risk-soft px-5 py-4 text-sm text-status-risk">
      {message}
    </div>
  );
}
