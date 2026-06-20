"use client";

import { useEffect } from "react";
import { X } from "lucide-react";

/**
 * A floating bottom sheet — rounded on all corners with a margin from the
 * screen edges, a dimmed backdrop and a soft scale/fade entrance, so it reads
 * as a clearly elevated surface (never flush against the tab bar).
 */
export function BottomSheet({
  open,
  onClose,
  title,
  children,
}: {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
}) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[55] flex items-end justify-center">
      <div className="absolute inset-0 bg-wuerth-ink/45 backdrop-blur-[2px] animate-fade-in" onClick={onClose} />

      <div className="relative mx-auto mb-2 w-[calc(100%-1rem)] max-w-[calc(30rem-1rem)] overflow-hidden rounded-3xl bg-white shadow-pop ring-1 ring-black/5 animate-sheet-in">
        <div className="flex flex-col items-center pt-2.5">
          <span className="h-1.5 w-10 rounded-full bg-zinc-200" />
        </div>

        {title && (
          <div className="flex items-center justify-between px-5 pb-1 pt-3">
            <h2 className="text-[17px] font-bold text-wuerth-ink">{title}</h2>
            <button
              onClick={onClose}
              className="grid h-8 w-8 place-items-center rounded-full bg-zinc-100 text-wuerth-slate transition-colors hover:bg-zinc-200"
              aria-label="Close"
            >
              <X size={17} />
            </button>
          </div>
        )}

        <div className="max-h-[72vh] overflow-y-auto px-5 pb-5 pt-2">{children}</div>
      </div>
    </div>
  );
}
