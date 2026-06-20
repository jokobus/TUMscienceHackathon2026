"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { askAssistant } from "@/lib/api";
import type { AssistantAction, AssistantTurn } from "@/lib/types";

interface Turn {
  prompt: string;
  reply: AssistantTurn | null; // null while loading
}

const SUGGESTIONS = [
  "Which event had the best ROI?",
  "Show me KIT students",
  "Who should I follow up with?",
  "What should we plan next?",
];

/**
 * Gemini-in-Docs style assistant. Resting state is a small centered pill in the
 * top bar; clicking it expands a floating panel (dimmed backdrop). It answers
 * questions over the dashboard data AND can jump/filter the UI via actions.
 */
export function Assistant() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [value, setValue] = useState("");
  const [turns, setTurns] = useState<Turn[]>([]);
  const [busy, setBusy] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Open with ⌘K / Ctrl+K, close with Esc
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpen(true);
      }
      if (e.key === "Escape") setOpen(false);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 40);
  }, [open]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [turns, busy]);

  async function send(prompt: string) {
    const p = prompt.trim();
    if (!p || busy) return;
    setValue("");
    setTurns((t) => [...t, { prompt: p, reply: null }]);
    setBusy(true);
    const reply = await askAssistant(p);
    setTurns((t) => t.map((turn, i) => (i === t.length - 1 ? { ...turn, reply } : turn)));
    setBusy(false);
  }

  function runAction(a: AssistantAction) {
    setOpen(false);
    router.push(a.href);
  }

  return (
    <>
      {/* Resting pill — small, centered (placed by the top bar) */}
      <button
        onClick={() => setOpen(true)}
        className="group flex w-full max-w-sm items-center gap-2 rounded-full border border-we-line bg-we-canvas px-3.5 py-1.5 text-sm text-we-muted shadow-sm transition-colors hover:border-we-red/40 hover:bg-we-surface"
      >
        <SparkleIcon className="h-4 w-4 text-we-red" />
        <span className="flex-1 text-left">Ask WEave…</span>
        <kbd className="hidden rounded border border-we-line bg-we-surface px-1.5 py-0.5 text-[10px] font-medium text-we-muted sm:inline">
          ⌘K
        </kbd>
      </button>

      {/* Expanded floating panel */}
      {open && (
        <div
          className="fixed inset-0 z-50 flex items-start justify-center bg-we-ink/30 px-4 pt-[12vh] backdrop-blur-[1px]"
          onClick={() => setOpen(false)}
        >
          <div
            className="w-full max-w-2xl overflow-hidden rounded-2xl border border-we-line bg-we-surface shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Input row */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                send(value);
              }}
              className="flex items-center gap-3 border-b border-we-line px-4 py-3.5"
            >
              <SparkleIcon className="h-5 w-5 shrink-0 text-we-red" />
              <input
                ref={inputRef}
                value={value}
                onChange={(e) => setValue(e.target.value)}
                placeholder="Ask anything about events, students, ROI…"
                className="flex-1 bg-transparent text-base text-we-ink outline-none placeholder:text-we-muted"
              />
              {busy && <Spinner />}
              <button type="button" onClick={() => setOpen(false)} className="text-xs text-we-muted hover:text-we-ink">
                Esc
              </button>
            </form>

            {/* Body: suggestions (empty) or conversation */}
            <div ref={scrollRef} className="max-h-[50vh] overflow-y-auto px-4 py-4">
              {turns.length === 0 ? (
                <div>
                  <div className="mb-2 text-xs font-medium text-we-muted">Try asking</div>
                  <div className="flex flex-wrap gap-2">
                    {SUGGESTIONS.map((s) => (
                      <button
                        key={s}
                        onClick={() => send(s)}
                        className="rounded-full border border-we-line bg-we-canvas px-3 py-1.5 text-sm text-we-slate transition-colors hover:border-we-red/40 hover:bg-we-red-soft hover:text-we-red"
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="space-y-5">
                  {turns.map((t, i) => (
                    <div key={i} className="space-y-2">
                      {/* user prompt */}
                      <div className="flex justify-end">
                        <div className="max-w-[80%] rounded-2xl rounded-tr-sm bg-we-canvas px-3.5 py-2 text-sm text-we-ink">
                          {t.prompt}
                        </div>
                      </div>
                      {/* assistant reply */}
                      <div className="flex gap-2.5">
                        <SparkleIcon className="mt-1 h-4 w-4 shrink-0 text-we-red" />
                        <div className="flex-1">
                          {t.reply === null ? (
                            <ThinkingDots />
                          ) : (
                            <>
                              <p className="text-sm leading-relaxed text-we-ink">{t.reply.answer}</p>
                              {t.reply.actions.length > 0 && (
                                <div className="mt-2 flex flex-wrap gap-2">
                                  {t.reply.actions.map((a, j) => (
                                    <button
                                      key={j}
                                      onClick={() => runAction(a)}
                                      className="inline-flex items-center gap-1 rounded-md bg-we-red px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-we-red-dark"
                                    >
                                      {a.label}
                                    </button>
                                  ))}
                                </div>
                              )}
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="border-t border-we-line px-4 py-2 text-[11px] text-we-muted">
              WEave Assistant · grounded in your event &amp; relationship data
            </div>
          </div>
        </div>
      )}
    </>
  );
}

function SparkleIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 2l1.8 5.6L19.4 9l-5.6 1.8L12 16.4 10.2 10.8 4.6 9l5.6-1.4L12 2z" />
      <path d="M19 14l.9 2.6L22.5 17.5l-2.6.9L19 21l-.9-2.6-2.6-.9 2.6-.9L19 14z" opacity="0.7" />
    </svg>
  );
}

function Spinner() {
  return (
    <svg className="h-4 w-4 animate-spin text-we-red" viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="3" opacity="0.25" />
      <path d="M21 12a9 9 0 0 0-9-9" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
    </svg>
  );
}

function ThinkingDots() {
  return (
    <div className="flex gap-1 py-1">
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          className="h-1.5 w-1.5 rounded-full bg-we-muted"
          style={{ animation: "pulse-soft 1s ease-in-out infinite", animationDelay: `${i * 0.15}s` }}
        />
      ))}
    </div>
  );
}
