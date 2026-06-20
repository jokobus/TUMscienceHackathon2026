import { redirect } from "next/navigation";

// Scanning now lives in the floating action button (see ScanFab); the standalone
// route is kept only so old links resolve, and forwards to the events list.
export default function ScanPage() {
  redirect("/events");
}
