import { Redirect } from "expo-router";
import { View } from "react-native";
import { useAuth } from "@/lib/auth";
import { WeaveLockup } from "@/components/ui/WuerthLogo";

export default function Index() {
  const { employee, loading } = useAuth();

  if (loading) {
    return (
      <View className="flex-1 items-center justify-center bg-wuerth-red">
        <WeaveLockup />
      </View>
    );
  }

  return <Redirect href={employee ? "/events" : "/login"} />;
}
