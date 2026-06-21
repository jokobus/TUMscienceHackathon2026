import { cn } from "@/lib/utils";

export function Card({
  className,
  children,
  ...rest
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "rounded-2xl bg-wuerth-surface shadow-card ring-1 ring-wuerth-line/70",
        className
      )}
      {...rest}
    >
      {children}
    </div>
  );
}

export function CardSection({
  className,
  children,
}: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("p-4", className)}>{children}</div>;
}
