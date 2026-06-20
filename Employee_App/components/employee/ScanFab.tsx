"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { QrCode, ScanLine, UserPlus, X } from "lucide-react";
import * as api from "@/lib/api";
import { students } from "@/lib/mock/seed";
import { Avatar } from "@/components/ui/Avatar";
import { useToast } from "@/components/ui/Toast";

/**
 * Floating "Scan" action that hovers above the tab bar and opens an iOS-style
 * half sheet (bottom-attached, slides up) to scan / simulate a student QR.
 */
// Only the top-level tab screens (no bottom composer / action bar of their own).
const ROOT_TABS = ["/events", "/messages", "/profile"];

export function ScanFab() {
  const router = useRouter();
  const pathname = usePathname();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [scanning, setScanning] = useState<string | null>(null);
  const showFab = ROOT_TABS.includes(pathname);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open]);

  async function scan(studentId: string) {
    setScanning(studentId);
    try {
      const { chatId, studentName } = await api.scanStudent(studentId);
      toast(`Connected with ${studentName} ✓`);
      setOpen(false);
      router.push(`/messages/${chatId}`);
    } finally {
      setScanning(null);
    }
  }

  if (!showFab) return null;

  return (
    <>
      {/* Floating action button, lower-right above the tab bar */}
      <div className="pointer-events-none fixed inset-x-0 bottom-0 z-50 mx-auto flex max-w-app justify-end pr-4">
        <button
          onClick={() => setOpen(true)}
          aria-label="Scan a student"
          className="pointer-events-auto mb-[max(5.25rem,calc(env(safe-area-inset-bottom)+4.75rem))] flex h-14 w-14 items-center justify-center rounded-2xl bg-wuerth-red text-white shadow-pop ring-4 ring-wuerth-bg transition-transform active:scale-95"
        >
          <ScanLine size={24} strokeWidth={2.2} />
        </button>
      </div>

      {/* iOS-style half sheet */}
      {open && (
        <div className="fixed inset-0 z-[60] flex items-end justify-center">
          <div
            className="absolute inset-0 bg-wuerth-ink/45 animate-fade-in"
            onClick={() => setOpen(false)}
          />

          <div className="relative mx-auto flex max-h-[85vh] w-full max-w-app flex-col rounded-t-3xl bg-white shadow-pop animate-slide-up">
            {/* grabber + header */}
            <div className="flex flex-col items-center pt-2.5">
              <span className="h-1.5 w-10 rounded-full bg-zinc-200" />
            </div>
            <div className="flex items-center justify-between px-5 pb-2 pt-3">
              <div>
                <h2 className="text-[17px] font-bold text-wuerth-ink">Scan a student</h2>
                <p className="text-xs text-wuerth-mute">Create a connection &amp; start messaging</p>
              </div>
              <button
                onClick={() => setOpen(false)}
                className="grid h-8 w-8 place-items-center rounded-lg bg-zinc-100 text-wuerth-slate transition-colors hover:bg-zinc-200"
                aria-label="Close"
              >
                <X size={17} />
              </button>
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto px-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] pt-1">
              {/* Camera viewport (mock) */}
              <div className="relative mx-auto aspect-square w-full max-w-[12rem] overflow-hidden rounded-2xl bg-wuerth-ink">
                <span className="absolute left-3 top-3 h-7 w-7 rounded-tl border-l-2 border-t-2 border-white/80" />
                <span className="absolute right-3 top-3 h-7 w-7 rounded-tr border-r-2 border-t-2 border-white/80" />
                <span className="absolute bottom-3 left-3 h-7 w-7 rounded-bl border-b-2 border-l-2 border-white/80" />
                <span className="absolute bottom-3 right-3 h-7 w-7 rounded-br border-b-2 border-r-2 border-white/80" />
                <span className="absolute inset-x-6 h-0.5 animate-scan-line bg-wuerth-red" />
                <QrCode className="absolute inset-0 m-auto text-white/15" size={88} />
              </div>
              <p className="mt-3 flex items-center justify-center gap-2 text-center text-xs text-wuerth-mute">
                <ScanLine size={14} /> No camera in the demo — pick a student to simulate.
              </p>

              <div className="mt-3 border-t border-wuerth-line pt-3">
                <div className="space-y-1">
                  {students.map((s) => (
                    <button
                      key={s.id}
                      onClick={() => scan(s.id)}
                      disabled={scanning !== null}
                      className="flex w-full items-center gap-3 rounded-lg p-2 text-left hover:bg-zinc-50 disabled:opacity-60"
                    >
                      <Avatar name={s.displayName} size="md" />
                      <div className="min-w-0 flex-1">
                        <div className="truncate text-sm font-semibold text-wuerth-ink">
                          {s.displayName}
                        </div>
                        <div className="truncate text-xs text-wuerth-mute">
                          {[s.university, s.studyDegree].filter(Boolean).join(" · ")}
                        </div>
                      </div>
                      {scanning === s.id ? (
                        <span className="text-xs font-semibold text-wuerth-red">Connecting…</span>
                      ) : (
                        <UserPlus size={16} className="text-wuerth-red" />
                      )}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
