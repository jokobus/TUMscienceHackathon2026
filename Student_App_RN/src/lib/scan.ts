/**
 * scan.ts — shared QR / deep-link handling for both the in-app scanner
 * (camera.tsx) and the external-camera deep link (app/e/[...rest].tsx).
 *
 * Flow (MASTER §6.1 / Phase 6.6): scanning a Würth event QR opens
 * `weave://e/{eventId}/{kind}/{token}`. Logged-in users check in immediately;
 * logged-out users are bounced to /login with the pending scan stashed, then
 * the scan is resumed after they authenticate.
 */
import { router } from "expo-router";
import * as api from "@/lib/api";
import { addRegistered } from "@/lib/registered";

export type ParsedScan = { kind: "event" | "employee"; id: string };
type ToastFn = (message: string, kind?: "success" | "info" | "error") => void;

/** Parse a Würth QR payload or `weave://` deep link into an action. */
export function parseScan(data: string): ParsedScan | null {
  if (!data) return null;
  // weave://e/{id}/check_in/{token}  ·  .../e/{id}/...  ·  event:{id}
  const evt = data.match(/\/e\/([^/]+)\/check/i) || data.match(/event[/:]([^/]+)/i);
  if (evt) return { kind: "event", id: evt[1] };
  const emp = data.match(/emp(?:loyee)?[/:]([^/]+)/i);
  if (emp) return { kind: "employee", id: emp[1] };
  if (/^evt-/.test(data)) return { kind: "event", id: data };
  if (/^emp-/.test(data)) return { kind: "employee", id: data };
  return null;
}

// In-memory pending scan, stashed across a login redirect and consumed once.
let pendingScan: ParsedScan | null = null;

export function setPendingScan(scan: ParsedScan | null): void {
  pendingScan = scan;
}

export function takePendingScan(): ParsedScan | null {
  const scan = pendingScan;
  pendingScan = null;
  return scan;
}

/**
 * Execute a parsed scan and navigate. Event scans check in then open the event;
 * employee scans connect then open the DM. Returns true on success.
 */
export async function performScan(parsed: ParsedScan, toast: ToastFn): Promise<boolean> {
  try {
    if (parsed.kind === "event") {
      await api.checkInEvent(parsed.id);
      addRegistered(parsed.id);
      toast("Checked in ✓");
      // ?scanned=1 ⇒ the event screen shows "Checked-in ✓" immediately (no flash).
      router.replace(`/(tabs)/feed/${parsed.id}?scanned=1` as never);
    } else {
      const res = await api.scanEmployee(parsed.id);
      toast(`Connected with ${res.employeeName} ✓`);
      router.replace(`/(tabs)/chat/${res.chatId}` as never);
    }
    return true;
  } catch (e) {
    toast(e instanceof Error ? e.message : "Scan failed.", "error");
    return false;
  }
}
