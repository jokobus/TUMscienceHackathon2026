import { useRef, useState } from "react";
import { Platform, Pressable, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { router, usePathname } from "expo-router";
import { CameraView, useCameraPermissions } from "expo-camera";
import { QrCode, ScanLine, UserPlus } from "lucide-react-native";
import type { StudentRef } from "@/lib/types";
import * as api from "@/lib/api";
import { students, studentById } from "@/lib/mock/seed";
import { Avatar } from "@/components/ui/Avatar";
import { Button } from "@/components/ui/Button";
import { BottomSheet } from "@/components/ui/BottomSheet";
import { ProfileSheet, type ProfilePerson } from "@/components/employee/ProfileSheet";
import { useToast } from "@/components/ui/Toast";
import { popShadow, wuerth } from "@/theme";

/** Parse a scanned QR value into a known student id, or null. */
function parseStudentId(raw: string): string | null {
  const m = raw.match(/weave:\/\/u\/([^/]+)/i);
  const id = m ? m[1] : raw.trim();
  return studentById(id) ? id : null;
}

export function ScanFab() {
  const insets = useSafeAreaInsets();
  const pathname = usePathname();
  const { toast } = useToast();
  const [permission, requestPermission] = useCameraPermissions();
  const [open, setOpen] = useState(false);
  const [preview, setPreview] = useState<{ person: ProfilePerson; studentId: string } | null>(null);
  const [connecting, setConnecting] = useState(false);
  const handledRef = useRef(false);

  const cameraReady = Platform.OS !== "web" && permission?.granted;

  function openPreview(student: StudentRef) {
    setOpen(false);
    setPreview({
      studentId: student.id,
      person: {
        name: student.displayName,
        role: "Student",
        details: [
          ...(student.university ? [{ label: "University", value: student.university }] : []),
          ...(student.studyDegree ? [{ label: "Programme", value: student.studyDegree }] : []),
        ],
      },
    });
  }

  function onScanned(data: string) {
    if (handledRef.current) return;
    const id = parseStudentId(data);
    if (!id) {
      toast("Unrecognised code — try again", "error");
      return;
    }
    handledRef.current = true;
    const student = studentById(id);
    if (student) openPreview(student);
    // reset the guard shortly so the next open can scan again
    setTimeout(() => (handledRef.current = false), 1500);
  }

  async function connect() {
    if (!preview) return;
    setConnecting(true);
    try {
      const { chatId, studentName } = await api.scanStudent(preview.studentId);
      toast(`Connected with ${studentName} ✓`);
      setPreview(null);
      router.push(`/messages/${chatId}`);
    } finally {
      setConnecting(false);
    }
  }

  // Hide the floating scan button inside an open chat thread — that screen has its
  // own message composer, and the FAB would overlap it. Root tabs still show it.
  const inChatThread = /^\/messages\/[^/]+$/.test(pathname ?? "");
  if (inChatThread) return null;

  return (
    <>
      <Pressable
        accessibilityLabel="Scan a student"
        onPress={() => setOpen(true)}
        style={[popShadow, { bottom: insets.bottom + 72 }]}
        className="absolute right-4 h-14 w-14 items-center justify-center rounded-2xl bg-wuerth-red active:opacity-90"
      >
        <ScanLine size={24} color="#fff" />
      </Pressable>

      <BottomSheet open={open} onClose={() => setOpen(false)} scrollable snapPoints={["85%"]} title="Scan a student">
        <Text className="mb-3 text-xs text-wuerth-mute">
          Point the camera at a student&apos;s WEave QR code, or pick one to simulate.
        </Text>

        {/* Camera viewport */}
        <View className="items-center">
          <View className="aspect-square w-full max-w-[16rem] overflow-hidden rounded-2xl bg-wuerth-ink">
            {cameraReady ? (
              <CameraView
                style={{ flex: 1 }}
                facing="back"
                barcodeScannerSettings={{ barcodeTypes: ["qr"] }}
                onBarcodeScanned={({ data }) => onScanned(data)}
              />
            ) : (
              <View className="flex-1 items-center justify-center">
                <QrCode size={88} color="rgba(255,255,255,0.15)" />
              </View>
            )}
            {/* reticle */}
            <View pointerEvents="none" className="absolute inset-0 items-center justify-center">
              <View className="h-40 w-40 rounded-2xl border-2 border-white/70" />
            </View>
          </View>

          {!cameraReady ? (
            <View className="mb-1 mt-3 items-center">
              {Platform.OS === "web" ? (
                <Text className="text-center text-xs text-wuerth-mute">
                  Camera scanning isn&apos;t available on web — pick a student below to simulate.
                </Text>
              ) : permission && !permission.granted ? (
                <Button size="sm" variant="secondary" onPress={requestPermission}>
                  Grant camera access
                </Button>
              ) : (
                <Text className="text-center text-xs text-wuerth-mute">Starting camera…</Text>
              )}
            </View>
          ) : (
            <View className="mb-1 mt-3 flex-row items-center gap-2">
              <ScanLine size={14} color={wuerth.mute} />
              <Text className="text-xs text-wuerth-mute">Scanning for a QR code…</Text>
            </View>
          )}
        </View>

        {/* Simulate list */}
        <View className="mt-3 gap-1 border-t border-wuerth-line pt-3">
          <Text className="mb-1 px-1 text-xs font-bold uppercase tracking-wide text-wuerth-mute">
            Or pick a student
          </Text>
          {students.map((s) => (
            <Pressable
              key={s.id}
              onPress={() => openPreview(s)}
              className="flex-row items-center gap-3 rounded-lg p-2 active:bg-zinc-50"
            >
              <Avatar name={s.displayName} size="md" />
              <View className="min-w-0 flex-1">
                <Text numberOfLines={1} className="text-sm font-semibold text-wuerth-ink">
                  {s.displayName}
                </Text>
                <Text numberOfLines={1} className="text-xs text-wuerth-mute">
                  {[s.university, s.studyDegree].filter(Boolean).join(" · ")}
                </Text>
              </View>
              <UserPlus size={16} color={wuerth.red} />
            </Pressable>
          ))}
        </View>
      </BottomSheet>

      {/* Profile preview → connect */}
      <ProfileSheet
        person={preview?.person ?? null}
        onClose={() => setPreview(null)}
        action={{
          label: "Connect & message",
          loading: connecting,
          icon: <UserPlus size={18} color="#fff" />,
          onPress: connect,
        }}
      />
    </>
  );
}
