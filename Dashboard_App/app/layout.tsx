import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { TopNav } from "@/components/shell/TopNav";

const inter = Inter({ subsets: ["latin"], variable: "--font-sans" });

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
    <html lang="en" className={inter.variable}>
      <body className="font-sans">
        <div className="flex h-screen flex-col overflow-hidden">
          <TopNav />
          <main className="flex-1 overflow-y-auto px-6 py-6">{children}</main>
        </div>
      </body>
    </html>
  );
}
