import { Pressable, type PressableProps } from "react-native";
import { cn } from "@/lib/utils";

export function IconButton({
  className,
  children,
  ...rest
}: PressableProps & { className?: string }) {
  return (
    <Pressable
      className={cn(
        "h-10 w-10 items-center justify-center rounded-full active:bg-black/10",
        className
      )}
      {...rest}
    >
      {children}
    </Pressable>
  );
}
