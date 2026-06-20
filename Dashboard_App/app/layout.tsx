import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { TopNav } from "@/components/shell/TopNav";
import { Assistant } from "@/components/shell/Assistant";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  title: "WEave - Würth Control Center",
  description:
    "Event Intelligence & Relationship-ROI control center for Wuerth Elektronik.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={inter.variable}>
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
