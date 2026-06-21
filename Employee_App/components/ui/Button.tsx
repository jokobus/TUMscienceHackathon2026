"use client";

import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

type Variant = "primary" | "secondary" | "ghost" | "danger";
type Size = "sm" | "md" | "lg";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  loading?: boolean;
  block?: boolean;
}

const variants: Record<Variant, string> = {
  primary:
    "bg-wuerth-red text-white hover:bg-wuerth-red-dark active:bg-wuerth-red-dark disabled:bg-wuerth-red/50",
  secondary:
    "bg-white text-wuerth-ink ring-1 ring-inset ring-wuerth-line hover:bg-zinc-50 active:bg-zinc-100",
  ghost: "bg-transparent text-wuerth-slate hover:bg-zinc-100 active:bg-zinc-200",
  danger: "bg-white text-wuerth-red ring-1 ring-inset ring-wuerth-red/30 hover:bg-wuerth-red-soft",
};

const sizes: Record<Size, string> = {
  sm: "h-9 px-3 text-sm gap-1.5 rounded-lg",
  md: "h-11 px-4 text-sm gap-2 rounded-xl",
  lg: "h-12 px-5 text-base gap-2 rounded-xl",
};

export function Button({
  variant = "primary",
  size = "md",
  loading = false,
  block = false,
  className,
  children,
  disabled,
  ...rest
}: ButtonProps) {
  return (
    <button
      className={cn(
        "inline-flex items-center justify-center font-semibold transition-colors disabled:cursor-not-allowed",
        variants[variant],
        sizes[size],
        block && "w-full",
        className
      )}
      disabled={disabled || loading}
      {...rest}
    >
      {loading && <Loader2 className="animate-spin" size={16} />}
      {children}
    </button>
  );
}
