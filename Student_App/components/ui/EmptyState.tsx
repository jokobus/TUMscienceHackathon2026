import { LucideIcon } from "lucide-react";

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  action?: {
    label: string;
    onClick: () => void;
  };
}

export function EmptyState({ icon: Icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center text-center py-16 px-4 bg-white rounded-2xl border-2 border-dashed border-gray-200 h-full min-h-[300px]">
      <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mb-4">
        <Icon className="w-8 h-8 text-gray-400" />
      </div>
      <h3 className="text-xl font-bold text-[var(--we-ink)] mb-2">{title}</h3>
      <p className="text-gray-500 max-w-[250px] mb-6 leading-relaxed">
        {description}
      </p>
      {action && (
        <button
          onClick={action.onClick}
          className="px-6 py-2.5 bg-gray-100 text-[var(--we-ink)] font-bold rounded-xl hover:bg-gray-200 transition-colors"
        >
          {action.label}
        </button>
      )}
    </div>
  );
}
