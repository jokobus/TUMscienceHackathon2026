import { useRef, useState } from "react";
import { Pressable, Text, View } from "react-native";
import { router } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { CameraView, useCameraPermissions } from "expo-camera";
import { ScanLine, TestTube, X } from "lucide-react-native";
import * as api from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { useToast } from "@/components/ui/Toast";

/** Parse a Würth QR payload into an action. */
function parseScan(data: string): { kind: "event" | "employee"; id: string } | null {
  const evt = data.match(/\/e\/([^/]+)\/check/i) || data.match(/event[/:]([^/]+)/i);
  if (evt) return { kind: "event", id: evt[1] };
  const emp = data.match(/emp(?:loyee)?[/:]([^/]+)/i);
  if (emp) return { kind: "employee", id: emp[1] };
  if (/^evt-/.test(data)) return { kind: "event", id: data };
  if (/^emp-/.test(data)) return { kind: "employee", id: data };
  return null;
}

export default function CameraScreen() {
  const insets = useSafeAreaInsets();
  const { toast } = useToast();
  const { user } = useAuth();
  const [permission, requestPermission] = useCameraPermissions();
  const handled = useRef(false);

  const [busy, setBusy] = useState(false);

  function ensureAuth(): boolean {
    if (!user) {
      toast("Sign in to scan.", "info");
      router.replace("/login");
      return false;
    }
    return true;
  }

  async function handleResult(parsed: { kind: "event" | "employee"; id: string }) {
    if (!ensureAuth()) return;
    setBusy(true);
    try {
      if (parsed.kind === "event") {
        await api.checkInEvent(parsed.id);
        toast(`Checked in ✓`);
        router.replace(`/(tabs)/feed/${parsed.id}` as any);
      } else {
        const res = await api.scanEmployee(parsed.id);
        toast(`Connected with ${res.employeeName} ✓`);
        router.replace(`/(tabs)/chat/${res.chatId}` as any);
      }
    } catch (e) {
      toast(e instanceof Error ? e.message : "Scan failed.", "error");
      handled.current = false;
      setBusy(false);
    }
  }

  function onBarcode(data: string) {
    if (handled.current || busy) return;
    const parsed = parseScan(data);
    if (!parsed) {
      // Unknown QR (e.g. a real Würth marketing code): don't dead-end the demo —
      // show the event feed so the user can browse and check in manually.
      handled.current = true;
      toast("QR not recognised — showing all Würth events.", "info");
      router.replace("/(tabs)/feed" as any);
      return;
    }
    handled.current = true;
    handleResult(parsed);
  }

  function onSimulate() {
    if (handled.current || busy) return;
    handled.current = true;
    // Demo: check in to the seeded ongoing hackathon.
    handleResult({ kind: "event", id: "evt-3" });
  }

  const granted = permission?.granted;

  return (
    <View className="flex-1 bg-black">
      {/* Top bar */}
      <View
        className="flex-row items-center justify-between px-6 pb-4"
        style={{ paddingTop: insets.top + 8 }}
      >
        <Text className="text-xl font-bold tracking-wider text-white">WE Scanner</Text>
        <Pressable
          onPress={() => router.back()}
          className="h-10 w-10 items-center justify-center rounded-full bg-white/10"
        >
          <X size={22} color="#fff" />
        </Pressable>
      </View>

      {/* Scanner area */}
      <View className="flex-1 items-center justify-center">
        {!permission ? (
          <Text className="text-gray-400">Checking camera…</Text>
        ) : !granted ? (
          <View className="items-center px-6">
            <ScanLine size={64} color="#9ca3af" />
            <Text className="mb-2 mt-4 text-xl font-medium text-white">Camera access needed</Text>
            <Text className="mb-6 text-center text-gray-400">
              Allow camera access to scan QR codes, or simulate a scan for the demo.
            </Text>
            <Pressable
              onPress={requestPermission}
              className="mb-3 rounded-xl bg-we-red px-6 py-3"
            >
              <Text className="font-medium text-white">Allow Camera</Text>
            </Pressable>
            <Pressable
              onPress={onSimulate}
              className="flex-row items-center rounded-xl border border-white/30 px-6 py-3"
            >
              <TestTube size={18} color="#fff" />
              <Text className="ml-2 font-medium text-white">Simulate Scan</Text>
            </Pressable>
          </View>
        ) : (
          <View className="w-full flex-1 items-center justify-center">
            <CameraView
              style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0 }}
              facing="back"
              barcodeScannerSettings={{ barcodeTypes: ["qr"] }}
              onBarcodeScanned={({ data }) => onBarcode(data)}
            />
            {/* Target overlay */}
            <View className="h-64 w-64 rounded-2xl border-2 border-we-red" />
            <Pressable
              onPress={onSimulate}
              style={{ position: "absolute", bottom: 24 }}
              className="flex-row items-center rounded-full border border-white/30 bg-white/20 px-4 py-2"
            >
              <TestTube size={16} color="#fff" />
              <Text className="ml-2 text-sm font-medium text-white">Simulate Scan</Text>
            </Pressable>
          </View>
        )}
      </View>

      {/* Bottom info */}
      <View className="px-8 pb-8 pt-4" style={{ paddingBottom: insets.bottom + 24 }}>
        <Text className="text-center font-medium text-gray-300">
          Point your camera at a Würth QR Code
        </Text>
        <Text className="mt-2 text-center text-sm text-gray-500">
          Check in to events or connect with employees
        </Text>
      </View>
    </View>
  );
}
