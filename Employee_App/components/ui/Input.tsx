import { cn } from "@/lib/utils";

export function Input({
  label,
  className,
  ...rest
}: React.InputHTMLAttributes<HTMLInputElement> & { label?: string }) {
  return (
    <label className="block">
      {label && (
        <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-wuerth-mute">
          {label}
        </span>
      )}
      <input
        className={cn(
          "h-11 w-full rounded-xl bg-white px-3.5 text-sm text-wuerth-ink ring-1 ring-inset ring-wuerth-line placeholder:text-wuerth-mute focus:outline-none focus:ring-2 focus:ring-wuerth-red",
          className
        )}
        {...rest}
      />
    </label>
  );
}

export function Textarea({
  label,
  className,
  ...rest
}: React.TextareaHTMLAttributes<HTMLTextAreaElement> & { label?: string }) {
  return (
    <label className="block">
      {label && (
        <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-wuerth-mute">
          {label}
        </span>
      )}
      <textarea
        className={cn(
          "w-full rounded-xl bg-white px-3.5 py-2.5 text-sm text-wuerth-ink ring-1 ring-inset ring-wuerth-line placeholder:text-wuerth-mute focus:outline-none focus:ring-2 focus:ring-wuerth-red",
          className
        )}
        {...rest}
      />
    </label>
  );
}
