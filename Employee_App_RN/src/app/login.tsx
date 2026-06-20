import { useEffect, useState } from "react";
import { KeyboardAvoidingView, Platform, ScrollView, Text, TextInput, View } from "react-native";
import { router } from "expo-router";
import { ArrowRight, Lock, Mail } from "lucide-react-native";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/Button";
import { WeaveLockup } from "@/components/ui/WuerthLogo";
import { wuerth } from "@/theme";

export default function LoginScreen() {
  const { employee, loading, login } = useAuth();
  const [email, setEmail] = useState("simon.haeckner@we-online.de");
  const [password, setPassword] = useState("wuerth");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!loading && employee) router.replace("/events");
  }, [employee, loading]);

  async function onSubmit() {
    setError(null);
    setSubmitting(true);
    try {
      await login(email, password);
      router.replace("/events");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login failed.");
      setSubmitting(false);
    }
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      className="flex-1 bg-wuerth-bg"
    >
      <ScrollView contentContainerStyle={{ flexGrow: 1 }} keyboardShouldPersistTaps="handled">
        <View className="bg-wuerth-red px-6 pb-12 pt-16">
          <WeaveLockup />
          <Text className="mt-6 text-center text-sm text-white/80">
            The on-site companion for Würth event teams.
          </Text>
        </View>

        <View className="-mt-6 flex-1 rounded-t-2xl bg-wuerth-bg px-6 pt-8">
          <Text className="text-xl font-bold text-wuerth-ink">Sign in</Text>
          <Text className="mt-1 text-sm text-wuerth-mute">
            Employees must log in to access internal tools.
          </Text>

          <View className="mt-6 gap-3">
            <View className="relative">
              <View className="absolute left-3.5 top-3.5 z-10">
                <Mail size={18} color={wuerth.mute} />
              </View>
              <TextInput
                value={email}
                onChangeText={setEmail}
                placeholder="you@we-online.com"
                placeholderTextColor={wuerth.mute}
                autoCapitalize="none"
                keyboardType="email-address"
                className="h-12 w-full rounded-xl border border-wuerth-line bg-white pl-11 pr-3.5 text-sm text-wuerth-ink"
              />
            </View>
            <View className="relative">
              <View className="absolute left-3.5 top-3.5 z-10">
                <Lock size={18} color={wuerth.mute} />
              </View>
              <TextInput
                value={password}
                onChangeText={setPassword}
                placeholder="Password"
                placeholderTextColor={wuerth.mute}
                secureTextEntry
                className="h-12 w-full rounded-xl border border-wuerth-line bg-white pl-11 pr-3.5 text-sm text-wuerth-ink"
              />
            </View>

            {error ? (
              <Text className="rounded-lg bg-wuerth-red-soft px-3 py-2 text-sm font-medium text-wuerth-red">
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
              Sign in
            </Button>
          </View>

          <View className="mt-6 rounded-xl border border-wuerth-line bg-white p-3.5">
            <Text className="text-xs font-semibold text-wuerth-ink">Demo accounts</Text>
            <Text className="mt-1 text-xs leading-relaxed text-wuerth-slate">
              simon.haeckner@we-online.de · jana.donges@we-online.com ·
              christian.kapusta@we-online.com{"\n"}Password for all:{" "}
              <Text className="font-semibold">wuerth</Text>
            </Text>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
