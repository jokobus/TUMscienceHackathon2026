import { ReactNode } from "react";
import type { BadgeTone } from "@/lib/format";

const TONE: Record<BadgeTone, { text: string; bg: string; dot: string }> = {
  good: { text: "text-status-good", bg: "bg-status-good-soft", dot: "bg-status-good" },
  warn: { text: "text-status-warn", bg: "bg-status-warn-soft", dot: "bg-status-warn" },
  risk: { text: "text-status-risk", bg: "bg-status-risk-soft", dot: "bg-status-risk" },
  neutral: { text: "text-status-neutral", bg: "bg-status-neutral-soft", dot: "bg-status-neutral" },
  info: { text: "text-status-info", bg: "bg-status-info-soft", dot: "bg-status-info" },
};

/**
 * Quiet tag — not a pill. Small radius, restrained tint, optional status dot.
 * For short metadata labels; long health labels read as low-key tags.
 */
export function Badge({
  tone = "neutral",
  children,
  dot = false,
}: {
  tone?: BadgeTone;
  children: ReactNode;
  dot?: boolean;
}) {
  const t = TONE[tone];
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-tag px-2 py-0.5 text-[11px] font-medium tracking-tight ${t.bg} ${t.text}`}
    >
      {dot && <span className={`h-1.5 w-1.5 rounded-full ${t.dot}`} />}
      {children}
    </span>
  );
}

/** Dot + label, no fill — the quietest status marker. */
export function StatusDot({
  tone = "neutral",
  children,
}: {
  tone?: BadgeTone;
  children: ReactNode;
}) {
  const t = TONE[tone];
  return (
    <span className="inline-flex items-center gap-2 text-[13px] text-we-slate">
      <span className={`h-1.5 w-1.5 rounded-full ${t.dot}`} />
      {children}
    </span>
  );
}
