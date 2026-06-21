"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Calendar, PlusCircle, MessageSquare, User, ScanLine, PlayCircle } from "lucide-react";
import { useStudentStore } from "@/lib/store";

export function Navigation() {
  const pathname = usePathname();
  const { userInteractions } = useStudentStore();
  
  // For the stub, if they are checked into an event, we assume it's "live"
  const liveEventId = userInteractions.checkedInEvents.length > 0 
    ? userInteractions.checkedInEvents[userInteractions.checkedInEvents.length - 1] 
    : null;

  const navItems = [
    { name: "Feed", href: "/feed", icon: Home },
    { name: "Requests", href: "/requests", icon: PlusCircle },
    { name: "Chat", href: "/chat", icon: MessageSquare },
    { name: "Profile", href: "/profile", icon: User },
  ];

  const renderItem = (item: { name: string; href: string; icon: React.ElementType }) => {
    const isActive = pathname.startsWith(item.href);
    const Icon = item.icon;
    return (
      <Link
        key={item.name}
        href={item.href}
        className={`flex flex-col items-center justify-center w-16 h-full space-y-1 transition-colors ${
          isActive ? "text-[var(--we-red)]" : "text-gray-400 hover:text-gray-600"
        }`}
      >
        <Icon className="w-5 h-5" strokeWidth={isActive ? 2.5 : 2} />
        <span className="text-[10px] font-medium tracking-wide">{item.name}</span>
      </Link>
    );
  };

  return (
    <>
      {/* Current Event FAB */}
      {liveEventId && !pathname.includes(`/events/${liveEventId}`) && (
        <div className="absolute bottom-24 right-4 z-50 animate-bounce">
          <Link
            href={`/events/${liveEventId}`}
            className="flex items-center gap-2 px-4 py-3 bg-[var(--we-red)] text-white rounded-full shadow-xl shadow-red-900/20 font-bold hover:bg-red-700 transition-colors"
          >
            <PlayCircle className="w-5 h-5" />
            Live Event
          </Link>
        </div>
      )}

      {/* Mobile Bottom Tab Bar */}
      <nav className="absolute bottom-0 w-full bg-white/95 backdrop-blur-md border-t border-gray-100 z-50 pb-safe">
        <div className="flex justify-between items-center h-16 px-4 relative max-w-[430px] mx-auto">
          {renderItem(navItems[0])}
          {renderItem(navItems[1])}
          
          {/* Spacer for Center Button */}
          <div className="w-16 flex-shrink-0" />
          
          {renderItem(navItems[2])}
          {renderItem(navItems[3])}

          {/* Absolute Centered Camera Button */}
          <Link
            href="/camera"
            className="absolute left-1/2 -translate-x-1/2 -top-2 flex items-center justify-center w-12 h-12 bg-[var(--we-red)] rounded-full shadow-lg text-white hover:scale-105 transition-transform"
          >
            <ScanLine className="w-5 h-5" />
          </Link>
        </div>
      </nav>
    </>
  );
}
