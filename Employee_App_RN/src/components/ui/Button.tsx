import { ActivityIndicator, Pressable, type PressableProps, Text } from "react-native";
import { cn } from "@/lib/utils";

type Variant = "primary" | "secondary" | "ghost" | "danger";
type Size = "sm" | "md" | "lg";

interface ButtonProps extends PressableProps {
  variant?: Variant;
  size?: Size;
  loading?: boolean;
  block?: boolean;
  icon?: React.ReactNode;
  className?: string;
  children?: React.ReactNode;
}

const variants: Record<Variant, { box: string; text: string }> = {
  primary: { box: "bg-wuerth-red active:bg-wuerth-red-dark", text: "text-white" },
  secondary: {
    box: "bg-white border border-wuerth-line active:bg-zinc-100",
    text: "text-wuerth-ink",
  },
  ghost: { box: "active:bg-zinc-100", text: "text-wuerth-slate" },
  danger: {
    box: "bg-white border border-wuerth-red/30 active:bg-wuerth-red-soft",
    text: "text-wuerth-red",
  },
};

const sizes: Record<Size, { box: string; text: string }> = {
  sm: { box: "h-9 px-3 rounded-lg", text: "text-sm" },
  md: { box: "h-11 px-4 rounded-xl", text: "text-sm" },
  lg: { box: "h-12 px-5 rounded-xl", text: "text-base" },
};

export function Button({
  variant = "primary",
  size = "md",
  loading = false,
  block = false,
  icon,
  className,
  children,
  disabled,
  ...rest
}: ButtonProps) {
  const v = variants[variant];
  const s = sizes[size];
  return (
    <Pressable
      disabled={disabled || loading}
      className={cn(
        "flex-row items-center justify-center gap-2",
        v.box,
        s.box,
        block && "w-full",
        (disabled || loading) && "opacity-50",
        className
      )}
      {...rest}
    >
      {loading ? (
        <ActivityIndicator size="small" color={variant === "primary" ? "#fff" : "#CC0000"} />
      ) : (
        icon
      )}
      {typeof children === "string" ? (
        <Text className={cn("font-semibold", s.text, v.text)}>{children}</Text>
      ) : (
        children
      )}
    </Pressable>
  );
}
