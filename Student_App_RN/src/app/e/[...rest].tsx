import { useEffect, useRef } from "react";
import { ActivityIndicator, Text, View } from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { useAuth } from "@/lib/auth";
import { useToast } from "@/components/ui/Toast";
import { performScan, setPendingScan, type ParsedScan } from "@/lib/scan";
import { we } from "@/theme";

/**
 * External-camera deep link: `weave://e/{eventId}/{kind}/{token}` (MASTER §6.1).
 * The OS opens the app at this route; we check in (or stash + bounce to login).
 */
export default function DeepLinkScanScreen() {
  const { rest } = useLocalSearchParams<{ rest?: string | string[] }>();
  const { user, loading } = useAuth();
  const { toast } = useToast();
  const handled = useRef(false);

  // Path segments after /e/  →  [eventId, kind, token]
  const segments = Array.isArray(rest) ? rest : rest ? [rest] : [];
  const eventId = segments[0];
  const parsed: ParsedScan | null = eventId ? { kind: "event", id: eventId } : null;

  useEffect(() => {
    if (loading || handled.current) return;
    handled.current = true;

    if (!parsed) {
      toast("That scan link wasn't recognised.", "error");
      router.replace("/(tabs)/feed");
      return;
    }
    if (!user) {
      // Persist the pending event across login, then resume after auth.
      setPendingScan(parsed);
      toast("Sign in to check in.", "info");
      router.replace("/login");
      return;
    }
    void performScan(parsed, toast);
  }, [loading, user, parsed, toast]);

  return (
    <View className="flex-1 items-center justify-center bg-white">
      <ActivityIndicator color={we.red} />
      <Text className="mt-3 text-sm text-gray-500">Opening your Würth event…</Text>
    </View>
  );
}
