import { ReactNode } from "react";
import type { BadgeTone } from "@/lib/format";

const TONE: Record<BadgeTone, string> = {
  good: "bg-status-good-soft text-status-good",
  warn: "bg-status-warn-soft text-status-warn",
  risk: "bg-status-risk-soft text-status-risk",
  neutral: "bg-status-neutral-soft text-status-neutral",
  info: "bg-status-info-soft text-status-info",
};

export function Badge({
  tone = "neutral",
  children,
  dot = false,
}: {
  tone?: BadgeTone;
  children: ReactNode;
  dot?: boolean;
}) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium ${TONE[tone]}`}
    >
      {dot && <span className="h-1.5 w-1.5 rounded-full bg-current" />}
      {children}
    </span>
  );
}
