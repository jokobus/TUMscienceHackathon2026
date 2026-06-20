import { Stack } from "expo-router";

export default function ChatStackLayout() {
  return (
    <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: "#ffffff" } }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="[chatId]" />
    </Stack>
  );
}
