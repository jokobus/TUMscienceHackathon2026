"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { QrCode, ScanLine, UserPlus } from "lucide-react";
import * as api from "@/lib/api";
import { students } from "@/lib/mock/seed";
import { TopAppBar } from "@/components/employee/TopAppBar";
import { Avatar } from "@/components/ui/Avatar";
import { BottomSheet } from "@/components/ui/BottomSheet";
import { Button } from "@/components/ui/Button";
import { useToast } from "@/components/ui/Toast";

export default function ScanPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [sheetOpen, setSheetOpen] = useState(false);
  const [scanning, setScanning] = useState<string | null>(null);

  async function scan(studentId: string) {
    setScanning(studentId);
    try {
      const { chatId, studentName } = await api.scanStudent(studentId);
      toast(`Connected with ${studentName} ✓`);
      setSheetOpen(false);
      router.push(`/messages/${chatId}`);
    } finally {
      setScanning(null);
    }
  }

  return (
    <div className="flex min-h-dvh flex-col bg-wuerth-ink">
      <div className="bg-wuerth-ink text-white">
        <TopAppBar
          back
          title="Scan a student"
          subtitle="Create a connection & start messaging"
        />
      </div>

      {/* Camera viewport (mock) */}
      <div className="relative flex flex-1 flex-col items-center justify-center px-8">
        <div className="relative aspect-square w-full max-w-[16rem] overflow-hidden rounded-3xl bg-black/40 ring-1 ring-white/10">
          {/* corner brackets */}
          <span className="absolute left-4 top-4 h-8 w-8 rounded-tl-lg border-l-4 border-t-4 border-wuerth-red" />
          <span className="absolute right-4 top-4 h-8 w-8 rounded-tr-lg border-r-4 border-t-4 border-wuerth-red" />
          <span className="absolute bottom-4 left-4 h-8 w-8 rounded-bl-lg border-b-4 border-l-4 border-wuerth-red" />
          <span className="absolute bottom-4 right-4 h-8 w-8 rounded-br-lg border-b-4 border-r-4 border-wuerth-red" />
          {/* animated scan line */}
          <span className="absolute inset-x-8 h-0.5 animate-scan-line bg-wuerth-red shadow-[0_0_12px_2px_rgba(204,0,0,0.7)]" />
          <QrCode className="absolute inset-0 m-auto text-white/15" size={120} />
        </div>

        <p className="mt-6 flex items-center gap-2 text-sm text-white/70">
          <ScanLine size={16} /> Point at a student&apos;s WEave QR code
        </p>
      </div>

      {/* Action */}
      <div className="px-6 pb-6">
        <Button block size="lg" onClick={() => setSheetOpen(true)}>
          <UserPlus size={18} /> Simulate a scan
        </Button>
        <p className="mt-2 text-center text-xs text-white/50">
          No camera in the demo — pick a student to simulate scanning their QR.
        </p>
      </div>

      <BottomSheet open={sheetOpen} onClose={() => setSheetOpen(false)} title="Simulate scanning a student">
        <div className="space-y-1">
          {students.map((s) => (
            <button
              key={s.id}
              onClick={() => scan(s.id)}
              disabled={scanning !== null}
              className="flex w-full items-center gap-3 rounded-xl p-2 text-left hover:bg-zinc-50 disabled:opacity-60"
            >
              <Avatar name={s.displayName} size="md" />
              <div className="min-w-0 flex-1">
                <div className="truncate text-sm font-semibold text-wuerth-ink">{s.displayName}</div>
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
      </BottomSheet>
    </div>
  );
}
