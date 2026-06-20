"use client";

import { createContext, useCallback, useContext, useState } from "react";
import { Check, Info, X } from "lucide-react";
import { cn } from "@/lib/utils";

type ToastKind = "success" | "info" | "error";
interface Toast {
  id: number;
  message: string;
  kind: ToastKind;
}

interface ToastContextValue {
  toast: (message: string, kind?: ToastKind) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const toast = useCallback((message: string, kind: ToastKind = "success") => {
    const id = Date.now() + Math.random();
    setToasts((prev) => [...prev, { id, message, kind }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 2800);
  }, []);

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}
      <div className="pointer-events-none fixed inset-x-0 top-3 z-[60] mx-auto flex max-w-app flex-col items-center gap-2 px-4">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={cn(
              "pointer-events-auto flex w-full items-center gap-2.5 rounded-xl px-3.5 py-3 text-sm font-medium shadow-pop animate-toast-in",
              t.kind === "success" && "bg-wuerth-ink text-white",
              t.kind === "info" && "bg-white text-wuerth-ink ring-1 ring-wuerth-line",
              t.kind === "error" && "bg-wuerth-red text-white"
            )}
          >
            <span className="grid h-5 w-5 place-items-center rounded-full bg-white/15">
              {t.kind === "error" ? <X size={13} /> : t.kind === "info" ? <Info size={13} /> : <Check size={13} />}
            </span>
            <span className="flex-1">{t.message}</span>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used within ToastProvider");
  return ctx;
}
