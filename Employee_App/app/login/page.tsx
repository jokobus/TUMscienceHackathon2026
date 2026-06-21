"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, Lock, Mail } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/Button";
import { WeaveLockup } from "@/components/ui/WuerthLogo";

export default function LoginPage() {
  const { employee, loading, login } = useAuth();
  const router = useRouter();
  const [email, setEmail] = useState("simon.haeckner@we-online.de");
  const [password, setPassword] = useState("wuerth");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!loading && employee) router.replace("/events");
  }, [employee, loading, router]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await login(email, password);
      router.replace("/events");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login failed.");
      setSubmitting(false);
    }
  }

  return (
    <div className="flex h-full flex-col overflow-y-auto bg-wuerth-bg">
      {/* Red brand header */}
      <div className="bg-wuerth-red px-6 pb-12 pt-16 text-white">
        <WeaveLockup />
        <p className="mt-6 text-center text-sm text-white/80">
          The on-site companion for Würth event teams.
        </p>
      </div>

      {/* Login card */}
      <div className="-mt-6 flex-1 rounded-t-2xl bg-wuerth-bg px-6 pt-8">
        <h1 className="text-xl font-bold text-wuerth-ink">Sign in</h1>
        <p className="mt-1 text-sm text-wuerth-mute">
          Employees must log in to access internal tools.
        </p>

        <form onSubmit={onSubmit} className="mt-6 space-y-3">
          <div className="relative">
            <Mail className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-wuerth-mute" size={18} />
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@we-online.com"
              autoComplete="username"
              className="h-12 w-full rounded-xl bg-white pl-11 pr-3.5 text-sm ring-1 ring-inset ring-wuerth-line focus:outline-none focus:ring-2 focus:ring-wuerth-red"
            />
          </div>
          <div className="relative">
            <Lock className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-wuerth-mute" size={18} />
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Password"
              autoComplete="current-password"
              className="h-12 w-full rounded-xl bg-white pl-11 pr-3.5 text-sm ring-1 ring-inset ring-wuerth-line focus:outline-none focus:ring-2 focus:ring-wuerth-red"
            />
          </div>

          {error && (
            <p className="rounded-lg bg-wuerth-red-soft px-3 py-2 text-sm font-medium text-wuerth-red">
              {error}
            </p>
          )}

          <Button type="submit" size="lg" block loading={submitting}>
            Sign in
            {!submitting && <ArrowRight size={18} />}
          </Button>
        </form>

        <div className="mt-6 rounded-xl bg-white p-3.5 text-xs text-wuerth-slate ring-1 ring-wuerth-line">
          <p className="font-semibold text-wuerth-ink">Demo accounts</p>
          <p className="mt-1 leading-relaxed">
            simon.haeckner@we-online.de · jana.donges@we-online.com ·
            christian.kapusta@we-online.com<br />
            Password for all: <span className="font-mono font-semibold">wuerth</span>
          </p>
        </div>
      </div>
    </div>
  );
}
