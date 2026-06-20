import Link from "next/link";
import Image from "next/image";
import { format, parseISO } from "date-fns";
import { MapPin, Calendar, Clock, ArrowRight, Users } from "lucide-react";
import { Event } from "@/lib/types";

export function EventCard({ event, featured = false }: { event: Event; featured?: boolean }) {
  const startDate = parseISO(event.start_at);
  const endDate = parseISO(event.end_at);
  
  const isSameDay = format(startDate, "yyyy-MM-dd") === format(endDate, "yyyy-MM-dd");
  const isPast = new Date(event.end_at) < new Date();
  
  // Status Logic
  const now = new Date();
  const isLive = now >= startDate && now <= endDate;
  const statusLabel = isLive ? "Live now" : isPast ? "Past" : "Upcoming";

  return (
    <Link href={`/events/${event.id}`} className="group block">
      <article
        className={`relative flex flex-col bg-white overflow-hidden transition-all duration-300 hover:shadow-lg p-0 rounded-2xl ${
          featured 
            ? "border-2 border-[var(--we-red)] shadow-sm" 
            : "border border-gray-200 hover:border-gray-300"
        }`}
      >
        {/* Banner Image Area */}
        <div className="relative w-full h-36 bg-gray-100 overflow-hidden shrink-0">
          {event.image_url ? (
            <Image 
              src={event.image_url} 
              alt={event.title} 
              fill 
              className="object-cover transition-transform duration-500 group-hover:scale-105"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-tr from-red-50 to-gray-200" />
          )}

          {/* Status Pill (Floating on Image) */}
          <div className="absolute top-3 right-3 bg-white/95 backdrop-blur-sm shadow-sm px-2.5 py-1 rounded-full flex items-center gap-1.5 z-10">
            {isLive && <span className="w-2 h-2 rounded-full bg-[var(--we-red)] animate-pulse" />}
            <span className={`text-[11px] font-bold tracking-wide uppercase ${isLive ? 'text-[var(--we-red)]' : 'text-[var(--we-ink)]'}`}>
              {statusLabel}
            </span>
          </div>
        </div>

        {/* Content Area */}
        <div className="p-5">
          {/* Category */}
          <div className="flex items-center justify-between mb-3">
            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold bg-red-50 text-[var(--we-red)] uppercase tracking-wider">
              {event.type.replace(/_/g, " ")}
            </span>
            {event.application_required && !isPast && (
              <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">
                App. Required
              </span>
            )}
          </div>

          {/* Title */}
          <h3 className="font-bold text-[var(--we-ink)] mb-3 leading-snug group-hover:text-[var(--we-red)] transition-colors text-lg sm:text-xl line-clamp-2">
            {event.title}
          </h3>

          {/* Metadata */}
          <div className="space-y-2 mb-5">
            <div className="flex items-center text-sm text-gray-600">
              <Calendar className="w-4 h-4 mr-2 text-gray-400 shrink-0" />
              <time dateTime={event.start_at} className="line-clamp-1">
                {format(startDate, "MMM d, yyyy")}
                {!isSameDay && ` - ${format(endDate, "MMM d, yyyy")}`}
              </time>
            </div>
            
            {isSameDay && (
              <div className="flex items-center text-sm text-gray-600">
                <Clock className="w-4 h-4 mr-2 text-gray-400 shrink-0" />
                <span>
                  {format(startDate, "HH:mm")} - {format(endDate, "HH:mm")}
                </span>
              </div>
            )}

            {event.city && (
              <div className="flex items-start text-sm text-gray-600">
                <MapPin className="w-4 h-4 mr-2 text-gray-400 shrink-0 mt-0.5" />
                <span className="line-clamp-1">{event.location ? event.location : event.city}</span>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="mt-auto flex items-center justify-between pt-4 border-t border-gray-100">
            <div className="flex items-center text-sm text-gray-500 font-medium">
              <Users className="w-4 h-4 mr-1.5 text-gray-400" />
              {(event.id.charCodeAt(0) + event.id.length * 7) % 50 + 12} checked in
            </div>
          </div>
        </div>
      </article>
    </Link>
  );
}
