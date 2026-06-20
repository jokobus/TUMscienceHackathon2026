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
    <header className="relative z-40 flex h-16 items-center justify-between gap-6 border-b border-we-line bg-we-canvas/80 px-6 backdrop-blur-md md:px-10">
      {/* Left: wordmark + nav */}
      <div className="flex items-center gap-9">
        <Link href="/dashboard" className="flex items-baseline gap-2">
          <span className="flex h-7 w-7 items-center justify-center rounded-[5px] bg-we-red text-[12px] font-bold text-white">
            WE
          </span>
          <span className="font-display text-lg font-semibold tracking-tight text-we-ink">
            WEave
          </span>
        </Link>

        <nav className="hidden items-center gap-7 md:flex">
          {NAV.map((item) => {
            const active =
              pathname === item.href || pathname.startsWith(item.href + "/");
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`relative py-1 text-[13.5px] font-medium transition-colors duration-200 ${
                  active ? "text-we-ink" : "text-we-muted hover:text-we-ink"
                }`}
              >
                {item.label}
                {active && (
                  <span className="absolute -bottom-[21px] left-0 h-[2px] w-full bg-we-red" />
                )}
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Right: env marker + identity */}
      <div className="flex items-center gap-5">
        {USE_MOCKS && (
          <span className="hidden items-center gap-2 text-[11px] font-medium uppercase tracking-eyebrow text-we-muted sm:inline-flex">
            <span className="h-1.5 w-1.5 rounded-full bg-status-warn" />
            <span className="font-mono">Mock</span>
          </span>
        )}
        <div className="flex items-center gap-2.5">
          <span className="hidden text-right leading-tight md:block">
            <span className="block text-[13px] font-medium text-we-ink">Simon Häckner</span>
            <span className="block font-mono text-[10px] uppercase tracking-wider text-we-muted">
              Würth Elektronik
            </span>
          </span>
          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-we-ink font-mono text-[11px] font-semibold text-we-canvas">
            SH
          </span>
        </div>
      </div>
    </header>
  );
}
