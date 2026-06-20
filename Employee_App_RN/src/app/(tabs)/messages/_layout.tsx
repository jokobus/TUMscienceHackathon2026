import { Stack } from "expo-router";

export default function MessagesStack() {
  return (
    <Stack
      screenOptions={{ headerShown: false, contentStyle: { backgroundColor: "#F4F4F5" } }}
    />
  );
}
