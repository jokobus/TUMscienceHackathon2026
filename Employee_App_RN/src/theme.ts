import { Platform, type ViewStyle } from "react-native";

/**
 * Würth design tokens as JS constants — for places NativeWind classes can't
 * reach (lucide icon `color`/`stroke` props, QR colours, native shadow styles).
 * Mirrors the `wuerth` palette in tailwind.config.js.
 */
export const wuerth = {
  red: "#CC0000",
  redDark: "#A30000",
  redSoft: "#FBE9E9",
  ink: "#1A1A1A",
  slate: "#52525B",
  mute: "#8A8A8F",
  line: "#E4E4E7",
  surface: "#FFFFFF",
  bg: "#F4F4F5",
  white: "#FFFFFF",
} as const;

export const cardShadow: ViewStyle =
  Platform.select<ViewStyle>({
    ios: {
      shadowColor: "#101012",
      shadowOpacity: 0.08,
      shadowRadius: 3,
      shadowOffset: { width: 0, height: 1 },
    },
    android: { elevation: 2 },
    default: {},
  }) ?? {};

export const popShadow: ViewStyle =
  Platform.select<ViewStyle>({
    ios: {
      shadowColor: "#101012",
      shadowOpacity: 0.16,
      shadowRadius: 18,
      shadowOffset: { width: 0, height: 8 },
    },
    android: { elevation: 12 },
    default: {},
  }) ?? {};
