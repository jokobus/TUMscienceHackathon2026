"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { USE_MOCKS } from "@/lib/api";

/** Main navigation — 4 core pages (AGENT App-Shell). Student Detail is a drilldown. */
const NAV = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/create", label: "Create" },
  { href: "/communication", label: "Communication" },
  { href: "/students", label: "Relationships" },
];

export function TopNav() {
  const pathname = usePathname();

  return (
    <header className="relative z-40 flex h-[84px] items-stretch justify-between gap-6 border-b border-we-line bg-we-canvas/80 px-6 backdrop-blur-md md:px-10">
      {/* Left: wordmark + nav */}
      <div className="flex items-stretch gap-12">
        <Link href="/dashboard" className="flex items-center gap-2.5">
          <span className="flex h-9 w-9 items-center justify-center rounded-md bg-we-red text-sm font-bold text-white">
            WE
          </span>
          <span className="font-display text-xl font-semibold tracking-tight text-we-ink">
            WEave
          </span>
        </Link>

        <nav className="hidden items-stretch gap-10 md:flex">
          {NAV.map((item) => {
            const active =
              pathname === item.href || pathname.startsWith(item.href + "/");
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`relative flex items-center text-[15.5px] font-medium transition-colors duration-200 ${
                  active ? "text-we-ink" : "text-we-muted hover:text-we-ink"
                }`}
              >
                {item.label}
                {active && (
                  <span className="absolute bottom-0 left-0 h-[2.5px] w-full bg-we-red" />
                )}
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Right: env marker + identity */}
      <div className="flex items-center gap-6">
        {USE_MOCKS && (
          <span className="hidden items-center gap-2 text-[12px] font-medium uppercase tracking-eyebrow text-we-muted sm:inline-flex">
            <span className="h-1.5 w-1.5 rounded-full bg-status-warn" />
            <span className="font-mono">Mock</span>
          </span>
        )}
        <div className="flex items-center gap-3">
          <span className="hidden text-right leading-tight md:block">
            <span className="block text-[14.5px] font-semibold text-we-ink">Simon Häckner</span>
            <span className="block font-mono text-[11px] uppercase tracking-wider text-we-muted">
              Würth Elektronik
            </span>
          </span>
          <span className="flex h-10 w-10 items-center justify-center rounded-full bg-we-ink font-mono text-[13px] font-semibold text-we-canvas">
            SH
          </span>
        </div>
      </div>
    </header>
  );
}
