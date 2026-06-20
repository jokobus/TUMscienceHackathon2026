import { Text, TextInput, type TextInputProps, View } from "react-native";
import { cn } from "@/lib/utils";
import { wuerth } from "@/theme";

export function Input({
  label,
  className,
  ...rest
}: TextInputProps & { label?: string; className?: string }) {
  return (
    <View>
      {label && (
        <Text className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-wuerth-mute">
          {label}
        </Text>
      )}
      <TextInput
        placeholderTextColor={wuerth.mute}
        className={cn(
          "h-11 w-full rounded-xl border border-wuerth-line bg-white px-3.5 text-sm text-wuerth-ink focus:border-wuerth-red",
          className
        )}
        {...rest}
      />
    </View>
  );
}

export function Textarea({
  label,
  className,
  ...rest
}: TextInputProps & { label?: string; className?: string }) {
  return (
    <View>
      {label && (
        <Text className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-wuerth-mute">
          {label}
        </Text>
      )}
      <TextInput
        multiline
        textAlignVertical="top"
        placeholderTextColor={wuerth.mute}
        className={cn(
          "min-h-[80px] w-full rounded-xl border border-wuerth-line bg-white px-3.5 py-2.5 text-sm text-wuerth-ink focus:border-wuerth-red",
          className
        )}
        {...rest}
      />
    </View>
  );
}
