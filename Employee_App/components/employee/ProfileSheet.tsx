"use client";

import { useEffect } from "react";
import { X } from "lucide-react";
import { Avatar } from "@/components/ui/Avatar";
import { Chip } from "@/components/ui/Chip";

export type ProfilePerson = {
  name: string;
  role?: string; // e.g. "Student" / "Würth · Technical Sales"
  avatarTone?: "red" | "ink";
  badge?: { label: string; tone: "green" | "amber" | "neutral" | "red" };
  details?: { label: string; value: string }[];
};

/**
 * Bottom half sheet showing a compact account overview. Reused wherever a
 * person ("account") is tapped — chat headers, attendee rows, etc.
 */
export function ProfileSheet({
  person,
  onClose,
}: {
  person: ProfilePerson | null;
  onClose: () => void;
}) {
  useEffect(() => {
    if (!person) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [person, onClose]);

  if (!person) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-end justify-center">
      <div className="absolute inset-0 bg-wuerth-ink/45 animate-fade-in" onClick={onClose} />

      <div className="relative mx-auto flex max-h-[85vh] w-full max-w-app flex-col rounded-t-3xl bg-white shadow-pop animate-slide-up">
        <div className="flex flex-col items-center pt-2.5">
          <span className="h-1.5 w-10 rounded-full bg-zinc-200" />
        </div>
        <div className="flex items-center justify-end px-4 pt-2">
          <button
            onClick={onClose}
            className="grid h-8 w-8 place-items-center rounded-lg bg-zinc-100 text-wuerth-slate transition-colors hover:bg-zinc-200"
            aria-label="Close"
          >
            <X size={17} />
          </button>
        </div>

        <div className="overflow-y-auto px-6 pb-[max(1.5rem,env(safe-area-inset-bottom))] pt-1">
          <div className="flex flex-col items-center text-center">
            <Avatar name={person.name} size="xl" tone={person.avatarTone ?? "red"} />
            <h2 className="mt-3 text-xl font-bold text-wuerth-ink">{person.name}</h2>
            {person.role && <p className="mt-0.5 text-sm text-wuerth-mute">{person.role}</p>}
            {person.badge && (
              <Chip tone={person.badge.tone} className="mt-2.5">
                {person.badge.label}
              </Chip>
            )}
          </div>

          {person.details && person.details.length > 0 && (
            <dl className="mt-5 divide-y divide-wuerth-line rounded-2xl bg-zinc-50 px-4">
              {person.details.map((d) => (
                <div key={d.label} className="flex items-baseline justify-between gap-4 py-3">
                  <dt className="text-xs font-semibold uppercase tracking-wide text-wuerth-mute">
                    {d.label}
                  </dt>
                  <dd className="min-w-0 flex-1 text-right text-sm font-medium text-wuerth-ink">
                    {d.value}
                  </dd>
                </div>
              ))}
            </dl>
          )}
        </div>
      </div>
    </div>
  );
}
