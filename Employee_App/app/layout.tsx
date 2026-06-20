import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/lib/auth";
import { ToastProvider } from "@/components/ui/Toast";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });

export const metadata: Metadata = {
  applicationName: "WEave",
  title: "WEave · Würth Employee",
  description: "On-site companion for Würth employees — run events, capture signals, message attendees, view KPIs.",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "WEave",
  },
};

export const viewport: Viewport = {
  themeColor: "#CC0000",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={inter.variable}>
      <body>
        <AuthProvider>
          <ToastProvider>
            <div className="app-shell">{children}</div>
          </ToastProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
