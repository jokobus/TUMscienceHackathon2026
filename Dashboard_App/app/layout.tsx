import type { Metadata } from "next";
import { Fraunces, Inter, IBM_Plex_Mono } from "next/font/google";
import "./globals.css";
import { TopNav } from "@/components/shell/TopNav";
import { Assistant } from "@/components/shell/Assistant";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});

// Editorial serif display — the identity face, used for big moments only.
const fraunces = Fraunces({
  subsets: ["latin"],
  variable: "--font-display",
  weight: ["400", "500", "600", "700"],
  style: ["normal", "italic"],
  display: "swap",
});

// Mono for all numbers, eyebrows and metadata.
const plexMono = IBM_Plex_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
  weight: ["400", "500", "600"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "WEave — Würth Control Center",
  description:
    "Event Intelligence & Relationship-ROI control center for Würth Elektronik.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      className={`${inter.variable} ${fraunces.variable} ${plexMono.variable}`}
    >
      <body className="font-sans antialiased">
        <div className="flex h-screen flex-col overflow-hidden">
          <TopNav />
          {/* pb leaves room for the bottom-docked assistant bar */}
          <main className="flex-1 overflow-y-auto px-6 pb-28 pt-10 md:px-10">
            {children}
          </main>
        </div>
        <Assistant />
      </body>
    </html>
  );
}
