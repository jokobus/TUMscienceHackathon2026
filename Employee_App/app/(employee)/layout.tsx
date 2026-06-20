"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth";
import { TabBar } from "@/components/employee/TabBar";
import { ScanFab } from "@/components/employee/ScanFab";
import { WeaveLockup } from "@/components/ui/WuerthLogo";

export default function EmployeeLayout({ children }: { children: React.ReactNode }) {
  const { employee, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !employee) router.replace("/login");
  }, [employee, loading, router]);

  if (loading || !employee) {
    return (
      <div className="flex h-full items-center justify-center bg-wuerth-red">
        <WeaveLockup />
      </div>
    );
  }

  return (
    <div className="flex h-full min-h-0 flex-col">
      <main className="flex min-h-0 flex-1 flex-col overflow-hidden">{children}</main>
      <ScanFab />
      <TabBar />
    </div>
  );
}
