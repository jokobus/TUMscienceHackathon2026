/** Tiny className joiner (NativeWind className is a plain string). */
export function cn(...parts: Array<string | false | null | undefined>): string {
  return parts.filter(Boolean).join(" ");
}

const dtf = (opts: Intl.DateTimeFormatOptions) =>
  new Intl.DateTimeFormat("en-US", { timeZone: "UTC", ...opts });

/** "June 19, 2026" — matches date-fns format(d, "MMMM d, yyyy"). */
export function formatLongDate(iso: string): string {
  return dtf({ month: "long", day: "numeric", year: "numeric" }).format(new Date(iso));
}

/** "Jun 19, 2026" — matches date-fns format(d, "MMM d, yyyy"). */
export function formatShortDate(iso: string): string {
  return dtf({ month: "short", day: "numeric", year: "numeric" }).format(new Date(iso));
}

/** "14:00" — matches date-fns format(d, "HH:mm"). */
export function formatTime(iso: string): string {
  return dtf({ hour: "2-digit", minute: "2-digit", hour12: false }).format(new Date(iso));
}

/** Locale date string, like JS Date.toLocaleDateString(). */
export function localeDate(iso: string): string {
  return new Date(iso).toLocaleDateString();
}

export function isSameDay(startIso: string, endIso: string): boolean {
  return startIso.slice(0, 10) === endIso.slice(0, 10);
}

/** event_type → human label by replacing underscores (matches the web). */
export function typeLabel(type: string): string {
  return type.replace(/_/g, " ");
}

/** Human "time ago" relative to the spec reference date (2026-06-20). */
export function timeAgo(iso?: string | null, now = new Date("2026-06-20T11:00:00Z")): string {
  if (!iso) return "";
  const diff = now.getTime() - new Date(iso).getTime();
  const min = Math.round(diff / 60000);
  if (min < 1) return "now";
  if (min < 60) return `${min}m`;
  const hrs = Math.round(min / 60);
  if (hrs < 24) return `${hrs}h`;
  const days = Math.round(hrs / 24);
  if (days < 7) return `${days}d`;
  return formatShortDate(iso);
}

export function initials(name: string): string {
  return (
    name
      .split(" ")
      .filter(Boolean)
      .slice(0, 2)
      .map((p) => p[0]?.toUpperCase())
      .join("") || "ST"
  );
}

/** Primary image for an event (backend returns an images[] array). */
export function eventImage(images?: string[] | null): string | undefined {
  return images && images.length > 0 ? images[0] : undefined;
}

/** Deterministic "checked in" count from an event id (mirrors the web card). */
export function checkedInCount(id: string): number {
  return ((id.charCodeAt(0) + id.length * 7) % 50) + 12;
}
