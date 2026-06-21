"use client";

import { useEffect, useState } from "react";
import { LogIn, LogOut, RefreshCw } from "lucide-react";
import type { QrToken } from "@/lib/types";
import * as api from "@/lib/api";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { SegmentedControl } from "@/components/ui/SegmentedControl";
import { QRCode } from "@/components/ui/QRCode";
import { Skeleton } from "@/components/ui/Skeleton";

type Kind = "check_in" | "check_out";

export function QrPanel({ eventId }: { eventId: string }) {
  const [kind, setKind] = useState<Kind>("check_in");
  const [token, setToken] = useState<QrToken | null>(null);
  const [loading, setLoading] = useState(false);

  async function generate(k: Kind) {
    setLoading(true);
    setToken(null);
    const t = k === "check_in" ? await api.generateCheckInQr(eventId) : await api.generateCheckOutQr(eventId);
    setToken(t);
    setLoading(false);
  }

  useEffect(() => {
    generate(kind);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [kind, eventId]);

  return (
    <div className="space-y-3">
      <SegmentedControl<Kind>
        segments={[
          { value: "check_in", label: "Check-in" },
          { value: "check_out", label: "Check-out" },
        ]}
        value={kind}
        onChange={setKind}
      />

      <Card className="flex flex-col items-center p-5">
        <div className="mb-1 flex items-center gap-1.5 text-sm font-bold text-wuerth-ink">
          {kind === "check_in" ? <LogIn size={16} /> : <LogOut size={16} />}
          {kind === "check_in" ? "Check-in QR" : "Check-out QR (full session)"}
        </div>
        <p className="mb-4 max-w-[16rem] text-center text-xs text-wuerth-mute">
          {kind === "check_in"
            ? "Students scan this to register & check in to the event."
            : "Students scan this on the way out to record a full session."}
        </p>

        {loading || !token ? (
          <Skeleton className="h-[232px] w-[232px] rounded-2xl" />
        ) : (
          <QRCode value={token.token} size={200} />
        )}

        <Button
          variant="secondary"
          size="sm"
          className="mt-4"
          onClick={() => generate(kind)}
          disabled={loading}
        >
          <RefreshCw size={15} /> Regenerate
        </Button>
      </Card>
    </div>
  );
}
