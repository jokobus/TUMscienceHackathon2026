import { getMockEvents } from "@/lib/data";
import { format, parseISO } from "date-fns";
import { MapPin, Calendar, Clock, ArrowLeft, Share2 } from "lucide-react";
import { EventInteractive } from "@/components/student/EventInteractive";
import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";

export default async function EventPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const events = await getMockEvents();
  const event = events.find((e) => e.id === id);

  if (!event) {
    notFound();
  }

  const startDate = parseISO(event.start_at);
  const endDate = parseISO(event.end_at);
  const isSameDay = format(startDate, "yyyy-MM-dd") === format(endDate, "yyyy-MM-dd");
  const isPast = new Date(event.end_at) < new Date();

  return (
    <div className="min-h-screen bg-white max-w-3xl mx-auto pb-24 md:pb-6 relative">
      {/* Hero Image Section */}
      <div className="relative w-full h-64 sm:h-80 bg-gray-100">
        {event.image_url ? (
          <Image 
            src={event.image_url} 
            alt={event.title} 
            fill 
            className="object-cover"
            priority
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-tr from-[var(--we-red)] to-red-900" />
        )}
        
        {/* Overlay gradient for header legibility */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/50 via-transparent to-transparent" />
      </div>

      {/* Header Overlay & Back Button */}
      <header className="absolute top-0 left-0 w-full p-4 flex items-center justify-between z-10">
        <Link 
          href="/feed" 
          className="w-10 h-10 flex items-center justify-center rounded-full bg-white/20 backdrop-blur-md text-white hover:bg-white/30 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </Link>
      </header>

      <main className="px-4 sm:px-8 -mt-6 relative z-10 bg-white rounded-t-3xl pt-8 pb-12">
        {/* Category & Badges */}
        <div className="flex items-center gap-3 mb-4">
          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-red-50 text-[var(--we-red)] uppercase tracking-wider shadow-sm">
            {event.type.replace(/_/g, " ")}
          </span>
        </div>

        {/* Title Section */}
        <div className="mb-10">
          <h1 className="text-3xl sm:text-4xl font-bold text-[var(--we-ink)] mb-6 leading-tight">
            {event.title}
          </h1>
          
          <div className="flex flex-wrap gap-4 text-sm text-gray-600 bg-gray-50 p-4 rounded-xl">
            <div className="flex items-center">
              <Calendar className="w-4 h-4 mr-2 text-[var(--we-red)]" />
              <time dateTime={event.start_at}>
                {format(startDate, "MMMM d, yyyy")}
                {!isSameDay && ` - ${format(endDate, "MMMM d, yyyy")}`}
              </time>
            </div>
            {isSameDay && (
              <div className="flex items-center">
                <Clock className="w-4 h-4 mr-2 text-[var(--we-red)]" />
                <span>
                  {format(startDate, "HH:mm")} - {format(endDate, "HH:mm")}
                </span>
              </div>
            )}
            {event.city && (
              <div className="flex items-center">
                <MapPin className="w-4 h-4 mr-2 text-[var(--we-red)]" />
                <span>{event.city}{event.location ? `, ${event.location}` : ""}</span>
              </div>
            )}
          </div>
        </div>

        <EventInteractive event={event} isPast={isPast} />
      </main>
    </div>
  );
}
