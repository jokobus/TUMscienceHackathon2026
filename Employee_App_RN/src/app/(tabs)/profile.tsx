import { useEffect, useState } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import { router } from "expo-router";
import { Briefcase, Camera, LogOut, type LucideIcon, MapPin, Pencil } from "lucide-react-native";
import type { EmployeeProfile } from "@/lib/types";
import { useAuth } from "@/lib/auth";
import * as api from "@/lib/api";
import { TopAppBar } from "@/components/employee/TopAppBar";
import { NotificationsBell } from "@/components/employee/NotificationsBell";
import { Avatar } from "@/components/ui/Avatar";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { BottomSheet } from "@/components/ui/BottomSheet";
import { useToast } from "@/components/ui/Toast";
import { wuerth } from "@/theme";

export default function ProfileScreen() {
  const { toast } = useToast();
  const { employee, logout, setEmployee } = useAuth();
  const [editOpen, setEditOpen] = useState(false);

  const [firstName, setFirstName] = useState("");
  const [surname, setSurname] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (employee) {
      setFirstName(employee.firstName);
      setSurname(employee.surname);
      setAvatarUrl(employee.avatarUrl ?? "");
    }
  }, [employee]);

  async function save() {
    setSaving(true);
    const updated: EmployeeProfile = await api.updateProfile({
      firstName,
      surname,
      avatarUrl: avatarUrl.trim() || undefined,
    });
    setEmployee(updated);
    setSaving(false);
    setEditOpen(false);
    toast("Profile updated ✓");
  }

  async function onLogout() {
    await logout();
    router.replace("/login");
  }

  if (!employee) return null;

  return (
    <View className="flex-1 bg-wuerth-bg">
      <TopAppBar title="Profile" right={<NotificationsBell />} />
      <ScrollView contentContainerStyle={{ paddingBottom: 112 }}>
        <View className="border-b border-wuerth-line bg-white px-5 pb-6 pt-7">
          <View className="items-center">
            <View className="relative">
              <Avatar name={employee.displayName} src={employee.avatarUrl} size="xl" />
              <Pressable
                onPress={() => setEditOpen(true)}
                accessibilityLabel="Change picture"
                className="absolute -bottom-1 -right-1 h-8 w-8 items-center justify-center rounded-full border-2 border-white bg-wuerth-red"
              >
                <Camera size={15} color="#fff" />
              </Pressable>
            </View>
            <Text className="mt-3.5 text-xl font-bold text-wuerth-ink">{employee.displayName}</Text>
            <Text className="text-sm text-wuerth-mute">{employee.email}</Text>

            <Button
              variant="secondary"
              size="sm"
              className="mt-4"
              onPress={() => setEditOpen(true)}
              icon={<Pencil size={14} color={wuerth.ink} />}
            >
              Edit profile
            </Button>
          </View>
        </View>

        <View className="px-4 pt-5">
          <Text className="mb-2 px-1 text-xs font-bold uppercase tracking-wide text-wuerth-mute">
            Details
          </Text>
          <View className="gap-2.5">
            <DetailRow icon={Briefcase} label="Seniority" value={employee.seniority ?? "—"} />
            <DetailRow icon={MapPin} label="Branch / office" value={employee.branchOffice ?? "—"} />
          </View>
        </View>

        <View className="px-4 pt-6">
          <Button variant="danger" block onPress={onLogout} icon={<LogOut size={16} color={wuerth.red} />}>
            Log out
          </Button>
        </View>
      </ScrollView>

      <BottomSheet open={editOpen} onClose={() => setEditOpen(false)} title="Edit profile">
        <View className="mb-4 items-center">
          <Avatar name={`${firstName} ${surname}`} src={avatarUrl.trim() || undefined} size="xl" />
        </View>
        <View className="gap-3">
          <Input label="First name" value={firstName} onChangeText={setFirstName} />
          <Input label="Surname" value={surname} onChangeText={setSurname} />
          <Input
            label="Picture URL (optional)"
            value={avatarUrl}
            onChangeText={setAvatarUrl}
            placeholder="https://…"
            autoCapitalize="none"
          />
          <Button
            block
            onPress={save}
            loading={saving}
            disabled={!firstName.trim() || !surname.trim()}
          >
            Save changes
          </Button>
        </View>
      </BottomSheet>
    </View>
  );
}

function DetailRow({ icon: Icon, label, value }: { icon: LucideIcon; label: string; value: string }) {
  return (
    <Card className="flex-row items-center gap-3 p-3.5">
      <View className="h-10 w-10 items-center justify-center rounded-xl bg-zinc-100">
        <Icon size={18} color={wuerth.slate} />
      </View>
      <View>
        <Text className="text-xs text-wuerth-mute">{label}</Text>
        <Text className="text-sm font-semibold text-wuerth-ink">{value}</Text>
      </View>
    </Card>
  );
}
