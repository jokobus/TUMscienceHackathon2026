import { useEffect, useState } from "react";
import { Pressable, Text, View } from "react-native";
import { Bell, Inbox } from "lucide-react-native";
import type { NotificationItem } from "@/lib/types";
import * as api from "@/lib/api";
import { IconButton } from "@/components/ui/IconButton";
import { Badge } from "@/components/ui/Badge";
import { BottomSheet } from "@/components/ui/BottomSheet";
import { EmptyState } from "@/components/ui/EmptyState";
import { NotificationCard } from "@/components/employee/NotificationCard";

export function NotificationsBell() {
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<NotificationItem[]>([]);
  const [unread, setUnread] = useState(0);

  useEffect(() => {
    api.getNotifications().then((n) => {
      setItems(n);
      setUnread(n.filter((x) => !x.readAt).length);
    });
  }, []);

  async function markAll() {
    await Promise.all(items.filter((i) => !i.readAt).map((i) => api.markNotificationRead(i.id)));
    setItems((prev) =>
      prev.map((i) => ({ ...i, readAt: i.readAt ?? new Date().toISOString() }))
    );
    setUnread(0);
  }

  return (
    <>
      <IconButton accessibilityLabel="Notifications" onPress={() => setOpen(true)}>
        <Bell size={22} color="#fff" />
        <View className="absolute right-1 top-1">
          <Badge count={unread} />
        </View>
      </IconButton>

      <BottomSheet
        open={open}
        onClose={() => setOpen(false)}
        scrollable
        snapPoints={["85%"]}
        title="Notifications & reports"
      >
        {unread > 0 && (
          <Pressable
            onPress={markAll}
            className="mb-3 self-start rounded-lg bg-wuerth-red-soft px-3 py-1.5"
          >
            <Text className="text-xs font-bold text-wuerth-red">Mark all read</Text>
          </Pressable>
        )}
        {items.length === 0 ? (
          <EmptyState icon={Inbox} title="All clear" description="No notifications right now." />
        ) : (
          <View className="gap-6">
            {items.map((item) => (
              <NotificationCard key={item.id} item={item} onOpen={() => setOpen(false)} />
            ))}
          </View>
        )}
      </BottomSheet>
    </>
  );
}
