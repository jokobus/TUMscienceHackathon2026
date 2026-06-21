import type { LucideIcon } from "lucide-react";

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
}: {
  icon: LucideIcon;
  title: string;
  description?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center px-8 py-14 text-center">
      <span className="mb-3 grid h-14 w-14 place-items-center rounded-2xl bg-white text-wuerth-mute shadow-card ring-1 ring-wuerth-line">
        <Icon size={24} />
      </span>
      <h3 className="text-sm font-bold text-wuerth-ink">{title}</h3>
      {description && (
        <p className="mt-1 max-w-[16rem] text-sm text-wuerth-mute">{description}</p>
      )}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}
