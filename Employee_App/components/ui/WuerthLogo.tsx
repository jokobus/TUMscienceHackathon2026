import { cn } from "@/lib/utils";

/**
 * Würth wordmark. The real corporate logo is the "WÜRTH" wordmark in the
 * brand red (or reversed white-on-red). We render it as styled type so the
 * app stays asset-free while reading unmistakably as Würth.
 */
export function WuerthLogo({
  variant = "red",
  className,
}: {
  variant?: "red" | "white";
  className?: string;
}) {
  return (
    <span
      className={cn(
        "font-extrabold tracking-tight",
        variant === "red" ? "text-wuerth-red" : "text-white",
        className
      )}
    >
      <span className="text-[1.05em]">WÜRTH</span>
      <span
        className={cn(
          "ml-1 align-middle text-[0.62em] font-bold uppercase tracking-[0.18em]",
          variant === "red" ? "text-wuerth-mute" : "text-white/70"
        )}
      >
        Elektronik
      </span>
    </span>
  );
}

/** The WEave product lockup used on the login splash. */
export function WeaveLockup() {
  return (
    <div className="flex flex-col items-center">
      <WuerthLogo variant="white" className="text-2xl" />
      <div className="mt-3 flex items-center gap-2">
        <span className="h-px w-6 bg-white/40" />
        <span className="text-sm font-semibold uppercase tracking-[0.3em] text-white/90">
          WEave
        </span>
        <span className="h-px w-6 bg-white/40" />
      </div>
    </div>
  );
}
