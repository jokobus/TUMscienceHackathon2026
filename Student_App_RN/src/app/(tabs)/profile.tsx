import { useCallback, useState } from "react";
import { Pressable, ScrollView, Switch, Text, TextInput, View } from "react-native";
import { router, useFocusEffect } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Award, Bell, Calendar, Eye, LogIn, LogOut, Mail, Settings } from "lucide-react-native";
import type { InterestTagGroup, Memory, StudentProfile } from "@/lib/types";
import * as api from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { useToast } from "@/components/ui/Toast";
import { BottomSheet } from "@/components/ui/BottomSheet";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { cn, initials, localeDate } from "@/lib/utils";
import { we } from "@/theme";

export default function ProfileScreen() {
  const insets = useSafeAreaInsets();
  const { user, isStudent, logout } = useAuth();
  const { toast } = useToast();

  const [profile, setProfile] = useState<StudentProfile | null>(null);
  const [tagGroups, setTagGroups] = useState<InterestTagGroup[]>([]);
  const [selected, setSelected] = useState<number[]>([]);
  const [memories, setMemories] = useState<Memory[]>([]);

  const [settingsOpen, setSettingsOpen] = useState(false);
  const [university, setUniversity] = useState("");
  const [studyDegree, setStudyDegree] = useState("");
  const [hometown, setHometown] = useState("");
  const [notifications, setNotifications] = useState(true);
  const [emailUpdates, setEmailUpdates] = useState(true);
  const [consent, setConsent] = useState(false);
  const [currentPw, setCurrentPw] = useState("");
  const [newPw, setNewPw] = useState("");

  const load = useCallback(() => {
    if (!isStudent) return;
    api
      .getProfile()
      .then((p) => {
        setProfile(p);
        setSelected(p.interestTagIds ?? []);
        setUniversity(p.university ?? "");
        setStudyDegree(p.studyDegree ?? "");
        setHometown(p.hometown ?? "");
        setConsent(p.consentVisibleToRecruiters ?? false);
      })
      .catch(() => {});
    api.getInterestTags().then(setTagGroups).catch(() => {});
    api.getMyMemories().then(setMemories).catch(() => {});
  }, [isStudent]);

  useFocusEffect(useCallback(() => load(), [load]));

  async function toggleInterest(tagId: number, _name: string) {
    const next = selected.includes(tagId)
      ? selected.filter((id) => id !== tagId)
      : [...selected, tagId];
    setSelected(next);
    try {
      await api.setInterests(next);
      // No success toast — the chip's selected highlight is feedback enough.
    } catch {
      setSelected(selected); // revert
      toast("Could not update interests.", "error");
    }
  }

  async function saveSettings() {
    try {
      const updated = await api.updateProfile({ university, studyDegree, hometown });
      setProfile(updated);
      setSettingsOpen(false);
      toast("Settings saved successfully.");
    } catch (e) {
      toast(e instanceof Error ? e.message : "Could not save.", "error");
    }
  }

  async function toggleConsent(next: boolean) {
    setConsent(next);
    try {
      const updated = await api.updateProfile({ consentVisibleToRecruiters: next });
      setProfile(updated);
      // No success toast — the switch position is feedback enough.
    } catch (e) {
      setConsent(!next); // revert
      toast(e instanceof Error ? e.message : "Could not update.", "error");
    }
  }

  async function changePassword() {
    if (!currentPw || !newPw) {
      toast("Enter current and new password.", "info");
      return;
    }
    try {
      await api.changePassword(currentPw, newPw);
      setCurrentPw("");
      setNewPw("");
      toast("Password changed ✓");
    } catch (e) {
      toast(e instanceof Error ? e.message : "Could not change password.", "error");
    }
  }

  async function onSignOut() {
    await logout();
    router.replace("/(tabs)/feed");
  }

  // Not a full student (anonymous or guest) → prompt to sign in.
  if (!isStudent) {
    return (
      <View className="flex-1 bg-white px-4" style={{ paddingTop: insets.top + 24 }}>
        <Text className="mb-8 text-3xl font-bold text-we-ink">Profile</Text>
        <EmptyState
          icon={LogIn}
          title={user ? "Guest account" : "Sign in"}
          description="Sign in as a student to build your profile, pick interests and share memories."
          action={{ label: "Sign In", onClick: () => router.push("/login") }}
        />
        {user && (
          <Pressable
            onPress={onSignOut}
            className="mt-6 flex-row items-center justify-center rounded-xl border border-transparent p-4 active:bg-red-50"
          >
            <LogOut size={20} color={we.red} />
            <Text className="ml-2 font-bold text-we-red">Sign Out</Text>
          </Pressable>
        )}
      </View>
    );
  }

  const name = profile?.displayName ?? user?.displayName ?? "Student";
  const attendedEventIds = Array.from(new Set(memories.map((m) => m.eventId)));

  return (
    <View className="flex-1 bg-white">
      <ScrollView
        contentContainerStyle={{ paddingHorizontal: 16, paddingTop: insets.top + 16, paddingBottom: 32 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View className="mb-8 flex-row items-center justify-between">
          <Text className="text-3xl font-bold text-we-ink">Profile</Text>
          <Pressable onPress={() => setSettingsOpen(true)} className="rounded-full p-2 active:bg-gray-100">
            <Settings size={24} color="#4b5563" />
          </Pressable>
        </View>

        {/* User card */}
        <View className="mb-8 flex-row items-center gap-6 rounded-3xl border border-gray-200 bg-white p-6">
          <View className="h-24 w-24 items-center justify-center rounded-full border-4 border-white bg-red-50">
            <Text className="text-3xl font-bold text-we-red">{initials(name)}</Text>
          </View>
          <View className="flex-1">
            <Text className="text-2xl font-bold text-we-ink">{name}</Text>
            <Text className="mb-2 text-gray-500">{profile?.email ?? user?.email}</Text>
            <View className="flex-row flex-wrap gap-2">
              {!!profile?.university && (
                <View className="rounded-md bg-gray-100 px-2.5 py-0.5">
                  <Text className="text-xs font-medium text-gray-800">{profile.university}</Text>
                </View>
              )}
              {!!profile?.studyDegree && (
                <View className="rounded-md bg-gray-100 px-2.5 py-0.5">
                  <Text className="text-xs font-medium text-gray-800">{profile.studyDegree}</Text>
                </View>
              )}
            </View>
          </View>
        </View>

        {/* Interests */}
        <View className="mb-8">
          <Text className="mb-4 text-lg font-bold text-we-ink">Interest Areas</Text>
          <View className="gap-6">
            {tagGroups.map((group) => (
              <View key={group.category}>
                <Text className="mb-3 text-sm font-semibold uppercase tracking-wider text-gray-400">
                  {group.category}
                </Text>
                <View className="flex-row flex-wrap gap-2">
                  {group.tags.map((tag) => {
                    const on = selected.includes(tag.id);
                    return (
                      <Pressable
                        key={tag.id}
                        onPress={() => toggleInterest(tag.id, tag.name)}
                        className={cn(
                          "rounded-full px-4 py-2",
                          on ? "bg-we-red" : "border border-gray-200 bg-white"
                        )}
                      >
                        <Text className={cn("text-sm font-medium", on ? "text-white" : "text-gray-600")}>
                          {tag.name}
                        </Text>
                      </Pressable>
                    );
                  })}
                </View>
              </View>
            ))}
          </View>
        </View>

        {/* Attended events (derived from posted memories) */}
        <View className="mb-8">
          <Text className="mb-4 text-lg font-bold text-we-ink">
            Attended Events
            {attendedEventIds.length > 0 && (
              <Text className="text-sm font-normal text-gray-400"> ({attendedEventIds.length})</Text>
            )}
          </Text>
          {attendedEventIds.length === 0 ? (
            <View className="rounded-2xl border border-gray-100 bg-gray-50 p-4">
              <Text className="text-center text-sm font-medium text-gray-500">
                No events attended yet
              </Text>
            </View>
          ) : (
            <View className="gap-3">
              {attendedEventIds.map((eventId) => (
                <Pressable
                  key={eventId}
                  onPress={() => router.push(`/(tabs)/feed/${eventId}` as any)}
                  className="flex-row items-center gap-3 rounded-2xl border border-gray-100 bg-white p-4"
                >
                  <View className="h-10 w-10 items-center justify-center rounded-xl bg-red-50">
                    <Calendar size={20} color={we.red} />
                  </View>
                  <View>
                    <Text className="text-sm font-bold text-we-ink">Event {eventId}</Text>
                    <Text className="text-xs text-gray-500">ID: {eventId} • Attended</Text>
                  </View>
                </Pressable>
              ))}
            </View>
          )}
        </View>

        {/* My memories */}
        <View className="mb-8">
          <Text className="mb-4 text-lg font-bold text-we-ink">
            My Memories
            {memories.length > 0 && (
              <Text className="text-sm font-normal text-gray-400"> ({memories.length})</Text>
            )}
          </Text>
          {memories.length === 0 ? (
            <View className="items-center rounded-2xl border border-gray-100 bg-gray-50 p-6">
              <Award size={40} color="#d1d5db" />
              <Text className="mt-3 font-medium text-gray-500">No public memories yet.</Text>
              <Text className="mt-1 text-sm text-gray-400">
                Attend an event and share your experience!
              </Text>
            </View>
          ) : (
            <View className="gap-4">
              {memories.map((m) => (
                <View key={m.id} className="flex-row gap-4 rounded-2xl border border-gray-100 bg-white p-4">
                  <View className="h-10 w-10 items-center justify-center rounded-full bg-gray-200">
                    <Text className="font-bold text-gray-500">{initials(name)}</Text>
                  </View>
                  <View className="flex-1">
                    <View className="mb-1 flex-row items-center gap-2">
                      <Text className="text-sm font-bold text-we-ink">{name}</Text>
                      <Text className="text-xs text-gray-400">{localeDate(m.createdAt)}</Text>
                    </View>
                    <Text className="text-sm leading-relaxed text-gray-600">{m.body}</Text>
                  </View>
                </View>
              ))}
            </View>
          )}
        </View>

        {/* Sign out */}
        <Pressable
          onPress={onSignOut}
          className="mt-4 flex-row items-center justify-center rounded-xl border border-transparent p-4 active:bg-red-50"
        >
          <LogOut size={20} color={we.red} />
          <Text className="ml-2 font-bold text-we-red">Sign Out</Text>
        </Pressable>
      </ScrollView>

      {/* Settings sheet */}
      <BottomSheet open={settingsOpen} onClose={() => setSettingsOpen(false)} title="Settings" scrollable>
        <View className="gap-6 pt-1">
          {/* Account */}
          <View>
            <Text className="mb-4 text-xs font-bold uppercase tracking-wider text-gray-400">Account</Text>
            <View className="gap-4">
              <LabeledInput label="Hometown" value={hometown} onChangeText={setHometown} placeholder="e.g. Munich" />
              <LabeledInput label="University" value={university} onChangeText={setUniversity} placeholder="e.g. TUM" />
              <LabeledInput
                label="Degree"
                value={studyDegree}
                onChangeText={setStudyDegree}
                placeholder="e.g. B.Sc. Computer Science"
              />
            </View>
          </View>

          {/* Preferences */}
          <View>
            <Text className="mb-4 text-xs font-bold uppercase tracking-wider text-gray-400">Preferences</Text>
            <View className="gap-3">
              <ToggleRow
                icon={<Bell size={20} color={we.red} />}
                title="Push Notifications"
                subtitle="Event updates & messages"
                value={notifications}
                onValueChange={setNotifications}
              />
              <ToggleRow
                icon={<Mail size={20} color={we.red} />}
                title="Email Newsletter"
                subtitle="Career tips & WE news"
                value={emailUpdates}
                onValueChange={setEmailUpdates}
              />
            </View>
          </View>

          {/* Privacy */}
          <View>
            <Text className="mb-4 text-xs font-bold uppercase tracking-wider text-gray-400">Privacy</Text>
            <ToggleRow
              icon={<Eye size={20} color={we.red} />}
              title="Visible to recruiters"
              subtitle="Let Würth see your profile & public memories"
              value={consent}
              onValueChange={toggleConsent}
            />
          </View>

          {/* Security */}
          <View>
            <Text className="mb-4 text-xs font-bold uppercase tracking-wider text-gray-400">Security</Text>
            <View className="gap-3">
              <LabeledInput
                label="Current password"
                value={currentPw}
                onChangeText={setCurrentPw}
                placeholder="••••••••"
                secureTextEntry
              />
              <LabeledInput
                label="New password"
                value={newPw}
                onChangeText={setNewPw}
                placeholder="••••••••"
                secureTextEntry
              />
              <Button variant="secondary" onPress={changePassword} block>
                Change Password
              </Button>
            </View>
          </View>

          <Button onPress={saveSettings} block size="lg">
            Save Preferences
          </Button>
        </View>
      </BottomSheet>
    </View>
  );
}

function LabeledInput({
  label,
  ...rest
}: { label: string } & React.ComponentProps<typeof TextInput>) {
  return (
    <View>
      <Text className="mb-1.5 text-xs font-bold text-we-ink">{label}</Text>
      <TextInput
        placeholderTextColor="#9ca3af"
        className="rounded-xl border border-gray-200 bg-gray-50 px-3 py-3 text-sm text-we-ink"
        {...rest}
      />
    </View>
  );
}

function ToggleRow({
  icon,
  title,
  subtitle,
  value,
  onValueChange,
}: {
  icon: React.ReactNode;
  title: string;
  subtitle: string;
  value: boolean;
  onValueChange: (v: boolean) => void;
}) {
  return (
    <View className="flex-row items-center justify-between rounded-xl border border-gray-100 bg-gray-50 p-3">
      <View className="flex-1 flex-row items-center gap-3">
        <View className="h-10 w-10 items-center justify-center rounded-full bg-white">{icon}</View>
        <View>
          <Text className="text-sm font-bold text-we-ink">{title}</Text>
          <Text className="text-xs text-gray-500">{subtitle}</Text>
        </View>
      </View>
      <Switch
        value={value}
        onValueChange={onValueChange}
        trackColor={{ true: we.red, false: "#e5e7eb" }}
        thumbColor="#fff"
      />
    </View>
  );
}
