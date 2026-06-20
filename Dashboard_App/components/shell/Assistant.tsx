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
 * Gemini-in-Google-Docs style assistant. Docked at the bottom-center of the
 * viewport. Resting state is a small sparkle pill; clicking expands a docked
 * input bar that grows a conversation panel upward. Answers questions over the
 * dashboard data AND can jump/filter the UI via actions.
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

  const hasText = value.trim().length > 0;

  return (
    <>
      {/* Click-catcher to collapse when clicking outside (no dim, Gemini-style) */}
      {open && <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />}

      <div className="fixed bottom-5 left-1/2 z-50 -translate-x-1/2">
        {/* Collapsed: larger pill with permanently visible text */}
        {!open && (
          <button
            onClick={() => setOpen(true)}
            aria-label="Open WEave Assistant"
            className="flex h-11 items-center justify-center gap-2 rounded-full border border-we-line bg-we-surface px-6 shadow-lg transition-all hover:bg-we-surface/80 hover:shadow-xl"
          >
            <SparkleIcon className="h-5 w-5 text-we-red" />
            <span className="text-base font-medium text-we-ink">
              Ask WEave
            </span>
          </button>
        )}

        {/* Expanded: conversation panel (grows upward) + docked input bar */}
        {open && (
          <div className="flex w-[min(680px,92vw)] flex-col gap-2">
            {/* Panel above the bar */}
            <div className="overflow-hidden rounded-2xl border border-we-line bg-we-surface shadow-2xl">
              <div ref={scrollRef} className="max-h-[55vh] overflow-y-auto px-4 py-4">
                {turns.length === 0 ? (
                  <div>
                    <div className="mb-2 flex items-center gap-2 text-xs font-medium text-we-muted">
                      <SparkleIcon className="h-3.5 w-3.5 text-we-red" />
                      WEave Assistant · grounded in your event &amp; relationship data
                    </div>
                    <div className="mt-3 flex flex-wrap gap-2">
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
            </div>

            {/* Docked input bar (the Gemini bar) */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                send(value);
              }}
              className="flex items-center gap-2 rounded-full border border-we-line bg-we-surface px-2 py-2 shadow-2xl"
            >
              <button
                type="button"
                onClick={() => setTurns([])}
                title="New chat"
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-we-slate transition-colors hover:bg-we-canvas"
              >
                <svg className="h-5 w-5" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6">
                  <path d="M10 4v12M4 10h12" strokeLinecap="round" />
                </svg>
              </button>

              <input
                ref={inputRef}
                value={value}
                onChange={(e) => setValue(e.target.value)}
                placeholder="Ask anything about events, students, ROI…"
                className="flex-1 bg-transparent px-1 text-[15px] text-we-ink outline-none placeholder:text-we-muted"
              />

              <span className="hidden rounded-md bg-status-info-soft px-1.5 py-0.5 text-[11px] font-semibold text-status-info sm:inline">
                Beta
              </span>

              {busy ? (
                <span className="flex h-9 w-9 items-center justify-center">
                  <Spinner />
                </span>
              ) : (
                <button
                  type="submit"
                  disabled={!hasText}
                  aria-label="Send"
                  className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full transition-colors ${
                    hasText
                      ? "bg-we-red text-white hover:bg-we-red-dark"
                      : "bg-we-canvas text-we-muted"
                  }`}
                >
                  <svg className="h-5 w-5" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.8">
                    <path d="M10 16V5M5 9l5-4 5 4" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </button>
              )}
            </form>
          </div>
        )}
      </div>
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
