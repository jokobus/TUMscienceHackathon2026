import { useEffect, useState } from "react";
import { Text, View } from "react-native";
import { LogIn, LogOut, RefreshCw } from "lucide-react-native";
import type { QrToken } from "@/lib/types";
import * as api from "@/lib/api";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { SegmentedControl } from "@/components/ui/SegmentedControl";
import { QRCode } from "@/components/ui/QRCode";
import { Skeleton } from "@/components/ui/Skeleton";
import { wuerth } from "@/theme";

type Kind = "check_in" | "check_out";

export function QrPanel({ eventId }: { eventId: string }) {
  const [kind, setKind] = useState<Kind>("check_in");
  const [token, setToken] = useState<QrToken | null>(null);
  const [loading, setLoading] = useState(false);

  async function generate(k: Kind) {
    setLoading(true);
    setToken(null);
    const t =
      k === "check_in" ? await api.generateCheckInQr(eventId) : await api.generateCheckOutQr(eventId);
    setToken(t);
    setLoading(false);
  }

  useEffect(() => {
    generate(kind);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [kind, eventId]);

  return (
    <View className="gap-3">
      <SegmentedControl<Kind>
        segments={[
          { value: "check_in", label: "Check-in" },
          { value: "check_out", label: "Check-out" },
        ]}
        value={kind}
        onChange={setKind}
      />

      <Card className="items-center p-5">
        <View className="mb-1 flex-row items-center gap-1.5">
          {kind === "check_in" ? (
            <LogIn size={16} color={wuerth.ink} />
          ) : (
            <LogOut size={16} color={wuerth.ink} />
          )}
          <Text className="text-sm font-bold text-wuerth-ink">
            {kind === "check_in" ? "Check-in QR" : "Check-out QR (full session)"}
          </Text>
        </View>
        <Text className="mb-4 max-w-[16rem] text-center text-xs text-wuerth-mute">
          {kind === "check_in"
            ? "Students scan this to register & check in to the event."
            : "Students scan this on the way out to record a full session."}
        </Text>

        {loading || !token ? (
          <Skeleton className="h-[232px] w-[232px] rounded-2xl" />
        ) : (
          <QRCode value={token.token} size={200} />
        )}

        <Button
          variant="secondary"
          size="sm"
          className="mt-4"
          onPress={() => generate(kind)}
          disabled={loading}
          icon={<RefreshCw size={15} color={wuerth.ink} />}
        >
          Regenerate
        </Button>
      </Card>
    </View>
  );
}
