import { cn, initials } from "@/lib/utils";

const sizes = {
  sm: "h-8 w-8 text-xs",
  md: "h-10 w-10 text-sm",
  lg: "h-14 w-14 text-lg",
  xl: "h-20 w-20 text-2xl",
};

export function Avatar({
  name,
  src,
  size = "md",
  tone = "red",
  className,
}: {
  name: string;
  src?: string;
  size?: keyof typeof sizes;
  tone?: "red" | "ink";
  className?: string;
}) {
  if (src) {
    // eslint-disable-next-line @next/next/no-img-element
    return (
      <img
        src={src}
        alt={name}
        className={cn("rounded-full object-cover ring-1 ring-wuerth-line", sizes[size], className)}
      />
    );
  }
  return (
    <span
      className={cn(
        "grid shrink-0 place-items-center rounded-full font-bold",
        tone === "red" ? "bg-wuerth-red-soft text-wuerth-red" : "bg-zinc-800 text-white",
        sizes[size],
        className
      )}
      aria-hidden
    >
      {initials(name)}
    </span>
  );
}
