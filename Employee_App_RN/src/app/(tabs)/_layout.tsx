import { useCallback, useState } from "react";
import { Redirect, Tabs, useFocusEffect } from "expo-router";
import { View } from "react-native";
import { CalendarDays, MessageSquare, User } from "lucide-react-native";
import { useAuth } from "@/lib/auth";
import * as api from "@/lib/api";
import { ScanFab } from "@/components/employee/ScanFab";
import { wuerth } from "@/theme";

export default function TabsLayout() {
  const { employee, loading } = useAuth();
  const [unread, setUnread] = useState(0);

  useFocusEffect(
    useCallback(() => {
      if (employee) {
        api.getChats().then((c) => setUnread(c.reduce((n, x) => n + x.unread, 0)));
      }
    }, [employee])
  );

  if (!loading && !employee) return <Redirect href="/login" />;

  return (
    <View className="flex-1">
      <Tabs
        screenOptions={{
          headerShown: false,
          tabBarActiveTintColor: wuerth.red,
          tabBarInactiveTintColor: wuerth.mute,
          tabBarStyle: { borderTopColor: wuerth.line },
          tabBarLabelStyle: { fontSize: 11, fontWeight: "600" },
        }}
      >
        <Tabs.Screen
          name="events"
          options={{
            title: "Events",
            tabBarIcon: ({ color, size }) => <CalendarDays color={color} size={size} />,
          }}
        />
        <Tabs.Screen
          name="messages"
          options={{
            title: "Messages",
            tabBarBadge: unread > 0 ? unread : undefined,
            tabBarBadgeStyle: { backgroundColor: wuerth.red },
            tabBarIcon: ({ color, size }) => <MessageSquare color={color} size={size} />,
          }}
        />
        <Tabs.Screen
          name="profile"
          options={{
            title: "Profile",
            tabBarIcon: ({ color, size }) => <User color={color} size={size} />,
          }}
        />
      </Tabs>
      <ScanFab />
    </View>
  );
}
