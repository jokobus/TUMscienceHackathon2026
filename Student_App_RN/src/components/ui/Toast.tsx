import { createContext, useCallback, useContext, useState } from "react";
import { Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Check, Info, X } from "lucide-react-native";
import { cn } from "@/lib/utils";
import { popShadow } from "@/theme";

type ToastKind = "success" | "info" | "error";
interface ToastItem {
  id: number;
  message: string;
  kind: ToastKind;
}

interface ToastContextValue {
  toast: (message: string, kind?: ToastKind) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const insets = useSafeAreaInsets();

  const toast = useCallback((message: string, kind: ToastKind = "success") => {
    const id = Date.now() + Math.random();
    setToasts((prev) => [...prev, { id, message, kind }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 2800);
  }, []);

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}
      <View
        pointerEvents="box-none"
        className="absolute inset-x-0 z-50 items-center gap-2 px-4"
        style={{ top: insets.top + 8 }}
      >
        {toasts.map((t) => (
          <View
            key={t.id}
            style={popShadow}
            className={cn(
              "w-full flex-row items-center gap-2.5 rounded-xl px-3.5 py-3",
              t.kind === "success" && "bg-wuerth-ink",
              t.kind === "info" && "border border-wuerth-line bg-white",
              t.kind === "error" && "bg-wuerth-red"
            )}
          >
            <View className="h-5 w-5 items-center justify-center rounded-full bg-white/15">
              {t.kind === "error" ? (
                <X size={13} color="#fff" />
              ) : t.kind === "info" ? (
                <Info size={13} color="#1A1A1A" />
              ) : (
                <Check size={13} color="#fff" />
              )}
            </View>
            <Text
              className={cn(
                "flex-1 text-sm font-medium",
                t.kind === "info" ? "text-wuerth-ink" : "text-white"
              )}
            >
              {t.message}
            </Text>
          </View>
        ))}
      </View>
    </ToastContext.Provider>
  );
}

export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used within ToastProvider");
  return ctx;
}
