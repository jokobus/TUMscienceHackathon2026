"use client";

import { QRCodeSVG } from "qrcode.react";

/** Würth-red QR rendered from a server-issued token. */
export function QRCode({ value, size = 200 }: { value: string; size?: number }) {
  return (
    <div className="inline-flex rounded-2xl bg-white p-4 shadow-card ring-1 ring-wuerth-line">
      <QRCodeSVG
        value={value}
        size={size}
        level="M"
        fgColor="#1A1A1A"
        bgColor="#FFFFFF"
        marginSize={0}
      />
    </div>
  );
}
