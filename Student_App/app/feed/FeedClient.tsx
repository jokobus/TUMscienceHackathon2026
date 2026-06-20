"use client";

import { useState } from "react";
import { Search } from "lucide-react";
import { EventCard } from "@/components/student/EventCard";
import { FeedFilters } from "@/components/student/FeedFilters";
import { EmptyState } from "@/components/ui/EmptyState";
import { Event } from "@/lib/types";

export function FeedClient({ initialEvents }: { initialEvents: Event[] }) {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState<string | null>(null);

  // Filter events
  let filteredEvents = [...initialEvents];

  if (searchQuery.trim()) {
    const q = searchQuery.toLowerCase();
    filteredEvents = filteredEvents.filter(e => 
      e.title.toLowerCase().includes(q) || 
      e.description.toLowerCase().includes(q) ||
      (e.city && e.city.toLowerCase().includes(q)) ||
      (e.location && e.location.toLowerCase().includes(q)) ||
      e.type.replace(/_/g, " ").toLowerCase().includes(q)
    );
  }

  if (activeFilter) {
    const now = new Date().getTime();
    switch (activeFilter) {
      case "Upcoming":
        filteredEvents = filteredEvents.filter(e => new Date(e.start_at).getTime() >= now);
        break;
      case "Past":
        filteredEvents = filteredEvents.filter(e => new Date(e.end_at).getTime() < now);
        break;
      case "Hackathons":
        filteredEvents = filteredEvents.filter(e => e.type === "hackathon");
        break;
      case "Seminars":
        filteredEvents = filteredEvents.filter(e => e.type === "seminar" || e.type === "webinar");
        break;
      case "Workshops":
        filteredEvents = filteredEvents.filter(e => e.type === "technical_talk");
        break;
      case "Career Fairs":
        filteredEvents = filteredEvents.filter(e => e.type === "career_fair_booth" || e.type === "trade_fair");
        break;
      case "Munich":
        filteredEvents = filteredEvents.filter(e => 
          e.city === "Munich" || 
          (e.location && e.location.toLowerCase().includes("münchen"))
        );
        break;
      case "Germany":
        filteredEvents = filteredEvents.filter(e => 
          (e.location && (e.location.includes(", DE") || e.location.includes("Germany")))
        );
        break;
    }
  }

  // Sort events chronologically (newest at top)
  const sortedEvents = filteredEvents.sort((a, b) => new Date(b.start_at).getTime() - new Date(a.start_at).getTime());

  return (
    <>
      <header className="mb-8">
        <h1 className="text-3xl font-bold text-[var(--we-ink)] mb-6">Discover Events</h1>
        
        {/* Search Bar */}
        <div className="relative mb-4">
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
            <Search className="h-5 w-5 text-gray-400" />
          </div>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="block w-full pl-11 pr-4 py-3 bg-white border border-gray-200 rounded-xl leading-5 bg-transparent placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[var(--we-red)] focus:border-transparent transition-shadow sm:text-sm shadow-sm"
            placeholder="Search events, locations, or topics..."
          />
        </div>

        <FeedFilters activeFilter={activeFilter} onFilterChange={setActiveFilter} />
      </header>

      {/* Feed */}
      <div className="flex flex-col gap-5">
        {sortedEvents.length === 0 ? (
          <EmptyState 
            icon={Search}
            title="No Events Found"
            description="Try adjusting your search or filters to find what you're looking for."
            action={activeFilter ? {
              label: "Clear Filter",
              onClick: () => setActiveFilter(null)
            } : undefined}
          />
        ) : (
          <>
            <p className="text-sm text-gray-400 -mt-2 mb-1">{sortedEvents.length} event{sortedEvents.length !== 1 ? "s" : ""} found</p>
            {sortedEvents.map((event, index) => (
              <EventCard key={event.id} event={event} featured={index === 0 && !searchQuery && !activeFilter} />
            ))}
          </>
        )}
      </div>
    </>
  );
}

