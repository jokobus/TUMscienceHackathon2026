import { ImageResponse } from "next/og";

// iOS home-screen icon (apple-touch-icon). Generated at build time — no asset file.
export const size = { width: 180, height: 180 };
export const contentType = "image/png";

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#CC0000",
          color: "#FFFFFF",
          fontSize: 112,
          fontWeight: 800,
          letterSpacing: -4,
        }}
      >
        W
      </div>
    ),
    { ...size }
  );
}
