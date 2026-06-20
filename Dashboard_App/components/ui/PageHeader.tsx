import { ReactNode } from "react";

/**
 * Editorial masthead. Mono eyebrow, serif display title, a quiet dek, and an
 * asymmetric right slot for a single key figure or control. Closed by a hairline.
 */
export function PageHeader({
  title,
  subtitle,
  eyebrow,
  action,
}: {
  title: string;
  subtitle?: string;
  eyebrow?: string;
  action?: ReactNode;
}) {
  return (
    <header className="mb-10 border-b border-we-line pb-7">
      <div className="flex items-end justify-between gap-8">
        <div className="max-w-2xl">
          {eyebrow && <div className="eyebrow mb-3">{eyebrow}</div>}
          <h1 className="font-display text-display-sm font-medium text-we-ink md:text-display">
            {title}
          </h1>
          {subtitle && (
            <p className="mt-3 max-w-xl text-[15px] leading-relaxed text-we-slate">
              {subtitle}
            </p>
          )}
        </div>
        {action && <div className="hidden shrink-0 md:block">{action}</div>}
      </div>
    </header>
  );
}

/** Numbered section label — editorial structure between blocks. */
export function SectionLabel({
  index,
  title,
  hint,
}: {
  index: string;
  title: string;
  hint?: string;
}) {
  return (
    <div className="mb-5 flex items-baseline gap-4">
      <span className="eyebrow text-we-faint">{index}</span>
      <h2 className="font-display text-xl font-medium text-we-ink">{title}</h2>
      {hint && (
        <span className="ml-auto hidden text-[13px] text-we-muted sm:block">
          {hint}
        </span>
      )}
    </div>
  );
}
