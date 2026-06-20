import { View } from "react-native";
import QRCodeSvg from "react-native-qrcode-svg";
import { cardShadow, wuerth } from "@/theme";

/** Würth-ink QR rendered from a server-issued token. */
export function QRCode({ value, size = 200 }: { value: string; size?: number }) {
  return (
    <View
      className="self-center rounded-2xl border border-wuerth-line bg-white p-4"
      style={cardShadow}
    >
      <QRCodeSvg value={value} size={size} color={wuerth.ink} backgroundColor="#FFFFFF" ecl="M" />
    </View>
  );
}
