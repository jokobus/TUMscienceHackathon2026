/**
 * mock/events.ts — real Würth Elektronik events, scraped into events.json.
 *
 * Used by lib/api.ts as the Feed's data source when no backend is configured
 * (EXPO_PUBLIC_API_BASE_URL unset → USE_BACKEND=false), and as a fallback if a
 * backend request fails. Mapped from the scraped shape onto WeaveEvent so the
 * Feed renders them identically to backend events.
 */
import type { EventStatus, WeaveEvent } from "@/lib/types";

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

// Relative require keeps this working in Metro regardless of resolveJsonModule.
// eslint-disable-next-line @typescript-eslint/no-require-imports
const rawEvents = require("./events.json") as RawEvent[];

// Electronics / event themed imagery (Unsplash) assigned round-robin.
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
  if (t.includes("seminar")) return "seminar";
  if (t.includes("messe") || t.includes("expo") || t.includes("fair") || t.includes("jobmesse"))
    return "career_fair";
  if (t.includes("kongress") || t.includes("conference") || t.includes("forum")) return "conference";
  if (t.includes("lab") || t.includes("labor")) return "lab_tour";
  if (d.includes("karriere")) return "career_fair";
  return "technical_talk";
}

function statusFor(startDate: string, endDate: string): EventStatus {
  const now = Date.now();
  const start = new Date(startDate).getTime();
  const end = new Date(endDate).getTime();
  if (Number.isNaN(start) || Number.isNaN(end)) return "upcoming";
  if (now < start) return "upcoming";
  if (now > end) return "past";
  return "ongoing";
}

function cityOf(location: string): string | null {
  if (!location) return null;
  return location.split(",")[0].trim() || null;
}

export const MOCK_EVENTS: WeaveEvent[] = rawEvents
  .map((r, i) => ({
    id: r.id,
    title: r.title.trim(),
    type: inferType(r.title, r.department),
    description: r.description,
    city: cityOf(r.location),
    location: r.location || null,
    startAt: r.startDate,
    endAt: r.endDate,
    status: statusFor(r.startDate, r.endDate),
    targetGroup: r.department || null,
    goal: null,
    partnerUniversity: null,
    images: [IMAGES[i % IMAGES.length]],
    applicationRequired: false,
    applicationOpenAt: null,
    applicationCloseAt: null,
    filesAfterEvent: false,
  }))
  // Soonest first; keeps the Feed's upcoming events at the top.
  .sort((a, b) => new Date(a.startAt).getTime() - new Date(b.startAt).getTime());

export function getMockEvent(id: string): WeaveEvent | null {
  return MOCK_EVENTS.find((e) => e.id === id) ?? null;
}
