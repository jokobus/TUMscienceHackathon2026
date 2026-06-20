"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { USE_MOCKS } from "@/lib/api";

/** Main navigation — 4 core pages (AGENT App-Shell). Student Detail is a drilldown. */
const NAV = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/create", label: "Create" },
  { href: "/communication", label: "Communication" },
  { href: "/students", label: "Student Explorer" },
];

export function TopNav() {
  const pathname = usePathname();

  return (
    <header className="relative z-40 flex h-14 items-center justify-between gap-4 border-b border-we-line bg-we-surface px-5">
      {/* Left cluster: logo + nav tabs next to it */}
      <div className="flex items-center gap-5">
        <Link href="/dashboard" className="flex items-center gap-2.5">
          <span className="flex h-8 w-8 items-center justify-center rounded bg-we-red text-sm font-bold text-white">
            WE
          </span>
          <span className="hidden leading-tight md:block">
            <span className="block text-sm font-semibold text-we-ink">WEave</span>
            <span className="block text-[10px] uppercase tracking-wide text-we-muted">
              Control Center
            </span>
          </span>
        </Link>

        <nav className="flex items-center gap-1">
          {NAV.map((item) => {
            const active =
              pathname === item.href || pathname.startsWith(item.href + "/");
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`whitespace-nowrap rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
                  active
                    ? "bg-we-red-soft text-we-red"
                    : "text-we-slate hover:bg-we-canvas"
                }`}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Right cluster: mock pill + avatar */}
      <div className="flex items-center gap-3">
        {USE_MOCKS && (
          <span className="hidden items-center gap-1.5 rounded-full bg-status-warn-soft px-2.5 py-1 text-xs font-medium text-status-warn sm:inline-flex">
            <span className="h-1.5 w-1.5 rounded-full bg-current" />
            Mock data
          </span>
        )}
        <div className="flex items-center gap-2">
          <span className="hidden text-right leading-tight md:block">
            <span className="block text-xs font-semibold text-we-ink">Simon Häckner</span>
            <span className="block text-[10px] text-we-muted">Würth Elektronik</span>
          </span>
          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-we-ink text-xs font-semibold text-white">
            SH
          </span>
        </div>
      </div>
    </header>
  );
}
