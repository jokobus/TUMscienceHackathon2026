import { cn } from "@/lib/utils";

export function IconButton({
  className,
  children,
  ...rest
}: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      className={cn(
        "relative grid h-10 w-10 place-items-center rounded-full text-current transition-colors hover:bg-black/5 active:bg-black/10",
        className
      )}
      {...rest}
    >
      {children}
    </button>
  );
}
