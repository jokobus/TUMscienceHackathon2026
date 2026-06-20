"use client";

const FILTER_CHIPS = ["Upcoming", "Past", "Hackathons", "Seminars", "Workshops", "Career Fairs", "Munich", "Germany"];

interface FeedFiltersProps {
  activeFilter?: string | null;
  onFilterChange?: (filter: string | null) => void;
}

export function FeedFilters({ activeFilter, onFilterChange }: FeedFiltersProps) {
  return (
    <div className="flex flex-wrap items-center gap-2 pb-2">
      {FILTER_CHIPS.map((tag) => (
        <button
          key={tag}
          onClick={() => onFilterChange?.(activeFilter === tag ? null : tag)}
          className={`flex-shrink-0 px-4 py-2 border rounded-full text-sm font-medium transition-colors shadow-sm ${
            activeFilter === tag 
              ? "bg-[var(--we-red)] text-white border-[var(--we-red)]" 
              : "bg-white border-gray-200 text-gray-600 hover:bg-gray-50"
          }`}
        >
          {tag}
        </button>
      ))}
    </div>
  );
}


