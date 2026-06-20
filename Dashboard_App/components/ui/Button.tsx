import { ButtonHTMLAttributes, ReactNode } from "react";

type Variant = "primary" | "secondary" | "ghost";

const VARIANT: Record<Variant, string> = {
  primary:
    "bg-we-ink text-we-canvas hover:bg-we-red border border-transparent",
  secondary:
    "bg-we-surface text-we-ink border border-we-line-strong hover:border-we-ink",
  ghost: "text-we-slate hover:text-we-ink border border-transparent",
};

/**
 * Flat, confident buttons. Primary is near-black ink that shifts to red on
 * hover (accent as punctuation, not as a permanent fill). Tight radius.
 */
export function Button({
  variant = "primary",
  children,
  className = "",
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: Variant;
  children: ReactNode;
}) {
  return (
    <button
      className={`inline-flex items-center justify-center gap-2 rounded-tag px-4 py-2 text-[13px] font-medium transition-colors duration-200 ease-premium disabled:cursor-not-allowed disabled:opacity-40 ${VARIANT[variant]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}
