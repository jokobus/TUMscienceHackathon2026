"use client";

import { useRouter } from "next/navigation";
import { ChevronLeft } from "lucide-react";
import { IconButton } from "@/components/ui/IconButton";

/** Red Würth header bar used at the top of each tab/screen. */
export function TopAppBar({
  title,
  subtitle,
  back = false,
  left,
  right,
}: {
  title: React.ReactNode;
  subtitle?: string;
  back?: boolean;
  left?: React.ReactNode;
  right?: React.ReactNode;
}) {
  const router = useRouter();
  return (
    <header className="sticky top-0 z-30 bg-wuerth-red text-white shadow-sm">
      <div className="flex h-14 items-center gap-1.5 px-2">
        {back ? (
          <IconButton onClick={() => router.back()} aria-label="Back" className="text-white">
            <ChevronLeft size={24} />
          </IconButton>
        ) : (
          left ?? <span className="w-2" />
        )}
        <div className="min-w-0 flex-1 px-1">
          <div className="truncate text-base font-bold leading-tight">{title}</div>
          {subtitle && <div className="truncate text-xs text-white/80">{subtitle}</div>}
        </div>
        {right}
      </div>
    </header>
  );
}
