"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth";
import { WeaveLockup } from "@/components/ui/WuerthLogo";

export default function RootPage() {
  const { employee, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;
    router.replace(employee ? "/events" : "/login");
  }, [employee, loading, router]);

  return (
    <div className="flex h-full items-center justify-center bg-wuerth-red">
      <WeaveLockup />
    </div>
  );
}
