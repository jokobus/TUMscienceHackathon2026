"use client";

import { cn } from "@/lib/utils";

interface Segment<T extends string> {
  value: T;
  label: string;
}

export function SegmentedControl<T extends string>({
  segments,
  value,
  onChange,
  scroll = false,
  className,
}: {
  segments: Segment<T>[];
  value: T;
  onChange: (value: T) => void;
  scroll?: boolean;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex gap-1 rounded-xl bg-zinc-100 p-1",
        scroll ? "overflow-x-auto no-scrollbar" : "",
        className
      )}
    >
      {segments.map((seg) => {
        const active = seg.value === value;
        return (
          <button
            key={seg.value}
            onClick={() => onChange(seg.value)}
            className={cn(
              "flex-1 whitespace-nowrap rounded-lg px-3 py-1.5 text-sm font-semibold transition-colors",
              active
                ? "bg-white text-wuerth-ink shadow-sm"
                : "text-wuerth-slate hover:text-wuerth-ink"
            )}
          >
            {seg.label}
          </button>
        );
      })}
    </div>
  );
}
