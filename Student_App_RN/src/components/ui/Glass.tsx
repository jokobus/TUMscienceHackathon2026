import { StyleSheet, type ViewStyle } from "react-native";
import { GlassView, isLiquidGlassAvailable, type GlassStyle } from "expo-glass-effect";

/**
 * True only on iOS 26+ where Apple's Liquid Glass material is available.
 * Everywhere else (web, Android, older iOS) this is false and callers must
 * render a solid fallback surface instead.
 */
export const liquidGlass = isLiquidGlassAvailable();

/**
 * A Liquid Glass material rendered as an absolutely-positioned background layer.
 * Drop it as the first child of a `relative` container and keep your normal
 * content on top. Returns null when Liquid Glass isn't available, so the parent's
 * own (solid) background shows through as the fallback.
 */
export function GlassFill({
  tint,
  interactive = false,
  radius,
  glassStyle = "regular",
  style,
}: {
  tint?: string;
  interactive?: boolean;
  radius?: number;
  glassStyle?: GlassStyle;
  style?: ViewStyle;
}) {
  if (!liquidGlass) return null;
  return (
    <GlassView
      glassEffectStyle={glassStyle}
      tintColor={tint}
      isInteractive={interactive}
      style={[StyleSheet.absoluteFill, radius != null ? { borderRadius: radius } : null, style]}
    />
  );
}
