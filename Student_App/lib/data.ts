/**
 * data.ts — Feed data source: real Würth Elektronik events (scraped → events.json).
 * Mapped onto the Event view-model so the Feed/event pages render them directly.
 */
import type { Event } from "@/lib/types";
import rawEvents from "@/lib/events.json";

interface RawEvent {
  id: string;
  title: string;
  startDate: string;
  endDate: string;
  location: string;
  department: string;
  description: string;
  isUpcoming: boolean;
}

const IMAGES = [
  "https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=900&q=70",
  "https://images.unsplash.com/photo-1531482615713-2afd69097998?auto=format&fit=crop&w=900&q=70",
  "https://images.unsplash.com/photo-1505373877841-8d25f7d46678?auto=format&fit=crop&w=900&q=70",
  "https://images.unsplash.com/photo-1497032205916-ac775f0649ae?auto=format&fit=crop&w=900&q=70",
  "https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?auto=format&fit=crop&w=900&q=70",
];

function inferType(title: string, department: string): string {
  const t = title.toLowerCase();
  const d = (department || "").toLowerCase();
  if (t.includes("hackathon")) return "hackathon";
  if (t.includes("workshop")) return "workshop";
  if (t.includes("webinar") || t.includes("online")) return "webinar";
  if (t.includes("seminar")) return "seminar";
  if (t.includes("messe") || t.includes("expo") || t.includes("fair") || t.includes("jobmesse"))
    return "trade_fair";
  if (t.includes("kongress") || t.includes("conference") || t.includes("forum")) return "technical_talk";
  if (d.includes("karriere")) return "career_fair_booth";
  return "technical_talk";
}

function cityOf(location: string): string | null {
  if (!location) return null;
  return location.split(",")[0].trim() || null;
}

const EVENTS: Event[] = (rawEvents as RawEvent[])
  .map((r, i) => ({
    id: r.id,
    title: r.title.trim(),
    description: r.description,
    start_at: r.startDate,
    end_at: r.endDate,
    type: inferType(r.title, r.department),
    city: cityOf(r.location),
    location: r.location || null,
    image_url: IMAGES[i % IMAGES.length],
    application_required: /hackathon|seminar|workshop/i.test(r.title),
  }))
  .sort((a, b) => new Date(a.start_at).getTime() - new Date(b.start_at).getTime());

export async function getMockEvents(): Promise<Event[]> {
  return EVENTS;
}
