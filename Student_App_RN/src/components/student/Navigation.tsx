import { useEffect, useState } from "react";
import { Pressable, Text, View } from "react-native";
import { router } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  Home,
  MessageSquare,
  PlayCircle,
  PlusCircle,
  ScanLine,
  User,
  type LucideIcon,
} from "lucide-react-native";
import { useAuth } from "@/lib/auth";
import * as api from "@/lib/api";
import { cn } from "@/lib/utils";
import { GlassFill, liquidGlass } from "@/components/ui/Glass";
import { we } from "@/theme";

/** Minimal slice of the expo-router/bottom-tabs tabBar props we actually use. */
interface TabBarProps {
  state: { index: number; routes: { key: string; name: string }[] };
  navigation: { navigate: (name: string) => void };
}

const TAB_META: Record<string, { name: string; icon: LucideIcon }> = {
  feed: { name: "Feed", icon: Home },
  requests: { name: "Requests", icon: PlusCircle },
  chat: { name: "Chat", icon: MessageSquare },
  profile: { name: "Profile", icon: User },
};

/**
 * Custom 5-slot bottom tab bar (Feed · Requests · Camera-center · Chat · Profile)
 * + the Current Event FAB — a 1:1 port of Student_App/components/ui/Navigation.tsx.
 */
export function StudentTabBar({ state, navigation }: TabBarProps) {
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const [liveEventId, setLiveEventId] = useState<string | null>(null);

  // Poll the current live event so the FAB appears once the student is checked in.
  useEffect(() => {
    if (!user || user.role === "guest") {
      setLiveEventId(null);
      return;
    }
    let cancelled = false;
    const tick = () =>
      api
        .getCurrentEvent()
        .then((e) => {
          if (!cancelled) setLiveEventId(e?.id ?? null);
        })
        .catch(() => {});
    tick();
    const interval = setInterval(tick, 20000);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [user]);

  const activeName = state.routes[state.index]?.name;

  const renderItem = (routeKey: string) => {
    const meta = TAB_META[routeKey];
    const isActive = activeName === routeKey;
    const Icon = meta.icon;
    return (
      <Pressable
        key={routeKey}
        onPress={() => navigation.navigate(routeKey)}
        className="h-full flex-1 items-center justify-center"
      >
        <Icon size={20} color={isActive ? we.red : "#9ca3af"} strokeWidth={isActive ? 2.5 : 2} />
        <Text
          className={cn(
            "mt-1 text-[10px] font-medium tracking-wide",
            isActive ? "text-we-red" : "text-gray-400"
          )}
        >
          {meta.name}
        </Text>
      </Pressable>
    );
  };

  return (
    <View
      className={cn("relative border-t border-gray-100", liquidGlass ? "" : "bg-white")}
      style={{ paddingBottom: insets.bottom }}
    >
      <GlassFill glassStyle="regular" />

      {/* Current Event FAB (live only) */}
      {liveEventId && (
        <Pressable
          onPress={() => router.push(`/(tabs)/feed/${liveEventId}` as any)}
          style={{ position: "absolute", right: 16, top: -64, zIndex: 60 }}
          className={cn(
            "flex-row items-center gap-2 overflow-hidden rounded-full px-4 py-3 shadow-lg",
            liquidGlass ? "" : "bg-we-red"
          )}
        >
          <GlassFill tint={we.red} interactive radius={22} />
          <PlayCircle size={20} color="#fff" />
          <Text className="font-bold text-white">Live Event</Text>
        </Pressable>
      )}

      {/* Row of 5 equal columns: Feed · Requests · (center gap) · Chat · Profile */}
      <View className="h-16 flex-row items-center">
        {renderItem("feed")}
        {renderItem("requests")}
        <View className="flex-1" />
        {renderItem("chat")}
        {renderItem("profile")}
      </View>

      {/* Centered Camera button → full-screen Scanner (overlay so it can sit higher) */}
      <View
        pointerEvents="box-none"
        className="absolute inset-x-0 items-center"
        style={{ top: -8 }}
      >
        <Pressable
          onPress={() => router.push("/camera")}
          className={cn(
            "h-12 w-12 items-center justify-center overflow-hidden rounded-full shadow-lg active:scale-95",
            liquidGlass ? "" : "bg-we-red"
          )}
        >
          <GlassFill tint={we.red} interactive radius={24} />
          <ScanLine size={20} color="#fff" />
        </Pressable>
      </View>
    </View>
  );
}
