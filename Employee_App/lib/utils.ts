import type { EventType, InteractionType } from "@/lib/types";

/** Tailwind class merge helper (tiny clsx). */
export function cn(...parts: Array<string | false | null | undefined>): string {
  return parts.filter(Boolean).join(" ");
}

const dtf = (opts: Intl.DateTimeFormatOptions) =>
  new Intl.DateTimeFormat("en-GB", { timeZone: "UTC", ...opts });

export function formatDateRange(startIso: string, endIso: string): string {
  const start = new Date(startIso);
  const end = new Date(endIso);
  const sameDay = startIso.slice(0, 10) === endIso.slice(0, 10);
  const day = dtf({ day: "numeric", month: "short" });
  const time = dtf({ hour: "2-digit", minute: "2-digit" });
  if (sameDay) {
    return `${day.format(start)} · ${time.format(start)}–${time.format(end)}`;
  }
  return `${day.format(start)} – ${dtf({ day: "numeric", month: "short", year: "numeric" }).format(end)}`;
}

export function formatDay(iso: string): string {
  return dtf({ day: "numeric", month: "short", year: "numeric" }).format(new Date(iso));
}

export function formatTime(iso: string): string {
  return dtf({ hour: "2-digit", minute: "2-digit" }).format(new Date(iso));
}

/** Human "time ago" relative to the spec reference date. */
export function timeAgo(iso: string, now = new Date("2026-06-20T11:00:00Z")): string {
  const diff = now.getTime() - new Date(iso).getTime();
  const min = Math.round(diff / 60000);
  if (min < 1) return "just now";
  if (min < 60) return `${min}m`;
  const hrs = Math.round(min / 60);
  if (hrs < 24) return `${hrs}h`;
  const days = Math.round(hrs / 24);
  if (days < 7) return `${days}d`;
  return formatDay(iso);
}

export function eventTypeLabel(type: EventType): string {
  const map: Record<EventType, string> = {
    hackathon: "Hackathon",
    guest_lecture: "Guest Lecture",
    career_fair_booth: "Career Fair",
    excursion: "Excursion",
    student_team: "Student Team",
    technical_talk: "Technical Talk",
    one_on_one: "1:1",
    seminar: "Seminar",
    webinar: "Webinar",
    conference: "Conference",
    trade_fair: "Trade Fair",
    other: "Event",
  };
  return map[type];
}

export function interactionLabel(type: InteractionType): string {
  const map: Partial<Record<InteractionType, string>> = {
    check_in: "Checked in",
    check_out: "Checked out",
    full_session: "Full session",
    file_view: "Viewed a file",
    file_download: "Downloaded a file",
    memory_post: "Posted a memory",
    question_asked: "Asked a question",
    chat_activity: "Chat activity",
    application_submitted: "Submitted an application",
    sample_interest: "Requested a sample",
    project_interest: "Expressed project interest",
    career_interest: "Expressed career interest",
    follow_up_request: "Requested a follow-up",
    recommendation_submitted: "Left a recommendation",
    connection: "Connected",
    re_engagement: "Re-engaged",
    repost: "Reposted",
  };
  return map[type] ?? type;
}

export function initials(name: string): string {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join("");
}

export function pct(value: number): string {
  return `${Math.round(value * 100)}%`;
}
