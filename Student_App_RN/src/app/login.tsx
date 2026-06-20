import { useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";
import { router } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { ArrowRight, Lock, Mail, User, X } from "lucide-react-native";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/Button";
import { WeaveLockup } from "@/components/ui/WuerthLogo";
import { cn } from "@/lib/utils";
import { wuerth } from "@/theme";

type Mode = "signin" | "signup" | "guest";

export default function LoginScreen() {
  const insets = useSafeAreaInsets();
  const { login, signup, guest } = useAuth();
  const [mode, setMode] = useState<Mode>("signin");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  function done() {
    if (router.canGoBack()) router.back();
    else router.replace("/(tabs)/feed");
  }

  async function onSubmit() {
    setError(null);
    setSubmitting(true);
    try {
      if (mode === "signin") await login(email.trim(), password);
      else if (mode === "signup") await signup(email.trim(), password, name.trim() || email.split("@")[0]);
      else await guest(email.trim(), name.trim() || undefined);
      done();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
      setSubmitting(false);
    }
  }

  const cta = mode === "signin" ? "Sign in" : mode === "signup" ? "Create account" : "Continue as guest";

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      className="flex-1 bg-we-canvas"
    >
      <ScrollView contentContainerStyle={{ flexGrow: 1 }} keyboardShouldPersistTaps="handled">
        <View className="bg-we-red px-6 pb-12" style={{ paddingTop: insets.top + 24 }}>
          <Pressable
            onPress={done}
            className="absolute right-4 h-10 w-10 items-center justify-center rounded-full bg-white/15"
            style={{ top: insets.top + 8 }}
          >
            <X size={20} color="#fff" />
          </Pressable>
          <WeaveLockup />
          <Text className="mt-6 text-center text-sm text-white/80">
            Connect with Würth Elektronik events.
          </Text>
        </View>

        <View className="-mt-6 flex-1 rounded-t-3xl bg-we-canvas px-6 pt-8">
          {/* Mode switch */}
          <View className="mb-6 flex-row gap-1 rounded-xl bg-gray-100 p-1">
            {(["signin", "signup", "guest"] as Mode[]).map((m) => (
              <Pressable
                key={m}
                onPress={() => {
                  setMode(m);
                  setError(null);
                }}
                className={cn("flex-1 rounded-lg py-2", mode === m && "bg-white")}
              >
                <Text
                  className={cn(
                    "text-center text-sm font-semibold",
                    mode === m ? "text-we-ink" : "text-gray-500"
                  )}
                >
                  {m === "signin" ? "Sign In" : m === "signup" ? "Sign Up" : "Guest"}
                </Text>
              </Pressable>
            ))}
          </View>

          <View className="gap-3">
            {(mode === "signup" || mode === "guest") && (
              <View className="relative justify-center">
                <View className="absolute left-3.5 z-10" pointerEvents="none">
                  <User size={18} color={wuerth.mute} />
                </View>
                <TextInput
                  value={name}
                  onChangeText={setName}
                  placeholder={mode === "guest" ? "Name (optional)" : "Full name"}
                  placeholderTextColor={wuerth.mute}
                  className="h-12 w-full rounded-xl border border-gray-200 bg-white pl-11 pr-3.5 text-sm text-we-ink"
                />
              </View>
            )}

            <View className="relative justify-center">
              <View className="absolute left-3.5 z-10" pointerEvents="none">
                <Mail size={18} color={wuerth.mute} />
              </View>
              <TextInput
                value={email}
                onChangeText={setEmail}
                placeholder="you@university.edu"
                placeholderTextColor={wuerth.mute}
                autoCapitalize="none"
                keyboardType="email-address"
                className="h-12 w-full rounded-xl border border-gray-200 bg-white pl-11 pr-3.5 text-sm text-we-ink"
              />
            </View>

            {mode !== "guest" && (
              <View className="relative justify-center">
                <View className="absolute left-3.5 z-10" pointerEvents="none">
                  <Lock size={18} color={wuerth.mute} />
                </View>
                <TextInput
                  value={password}
                  onChangeText={setPassword}
                  placeholder="Password"
                  placeholderTextColor={wuerth.mute}
                  secureTextEntry
                  className="h-12 w-full rounded-xl border border-gray-200 bg-white pl-11 pr-3.5 text-sm text-we-ink"
                />
              </View>
            )}

            {error ? (
              <Text className="rounded-lg bg-red-50 px-3 py-2 text-sm font-medium text-we-red">
                {error}
              </Text>
            ) : null}

            <Button
              size="lg"
              block
              loading={submitting}
              onPress={onSubmit}
              icon={!submitting ? <ArrowRight size={18} color="#fff" /> : undefined}
            >
              {cta}
            </Button>

            {mode === "guest" && (
              <Text className="text-center text-xs text-gray-400">
                Guests can browse, check in and view content, but can't chat or post memories.
              </Text>
            )}
          </View>

          <View className="mt-6 rounded-xl border border-gray-200 bg-white p-3.5">
            <Text className="text-xs font-semibold text-we-ink">Demo student</Text>
            <Text className="mt-1 text-xs leading-relaxed text-gray-500">
              thiviyan.saravanamuthu@tum.de · nakulan.sundarraju@tum.de{"\n"}Password for all:{" "}
              <Text className="font-semibold">weave</Text>
            </Text>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
