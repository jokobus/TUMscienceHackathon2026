import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Navigation } from "@/components/ui/Navigation";
import { Toaster } from "sonner";
import { StudentStoreProvider } from "@/lib/store";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "WEave — Student App",
  description: "Connect with Würth Elektronik events, explore opportunities, and build your profile.",
  appleWebApp: {
    title: "WEave",
    statusBarStyle: "default",
    capable: true,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${inter.variable} h-full antialiased`}
    >
      <body className="flex justify-center items-center h-full bg-gray-100 text-[var(--we-ink)] overflow-hidden">
        <StudentStoreProvider>
          {/* Mobile Frame Wrapper */}
          <div className="relative w-full h-[100dvh] sm:h-[min(100dvh,900px)] sm:max-w-[430px] sm:rounded-[3rem] sm:border-[8px] sm:border-gray-900 bg-[var(--we-canvas)] shadow-2xl overflow-hidden flex flex-col">
            
            <Toaster position="top-center" />
            <Navigation />
            
            {/* Main content area */}
            <main className="flex-1 h-full overflow-y-auto pb-20 relative bg-white sm:bg-[var(--we-canvas)]">
              {children}
            </main>
          </div>
        </StudentStoreProvider>
      </body>
    </html>
  );
}
