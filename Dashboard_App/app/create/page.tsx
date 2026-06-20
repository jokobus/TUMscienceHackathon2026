"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { askOpportunityAssistant, createEvent, getOpportunities } from "@/lib/api";
import { useAsync } from "@/lib/useAsync";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Skeleton, EmptyState } from "@/components/ui/States";
import { EVENT_TYPE_LABEL } from "@/lib/format";
import type { AssistantReply, CreateEventInput, EventType } from "@/lib/types";

const TABS = ["manual", "explorer"] as const;
type Tab = (typeof TABS)[number];

const EVENT_TYPES = Object.keys(EVENT_TYPE_LABEL) as EventType[];

export default function CreatePage() {
  const [tab, setTab] = useState<Tab>("manual");

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <PageHeader
        title="Create"
        subtitle="Create a new event manually, or explore future opportunities with the planning assistant."
      />

      <div className="flex gap-1 rounded-md border border-we-line bg-we-surface p-1 text-sm">
        <TabButton active={tab === "manual"} onClick={() => setTab("manual")}>
          Manual Event Creation
        </TabButton>
        <TabButton active={tab === "explorer"} onClick={() => setTab("explorer")}>
          Opportunity Explorer
        </TabButton>
      </div>

      {tab === "manual" ? <ManualCreate /> : <OpportunityExplorer />}
    </div>
  );
}

function TabButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex-1 rounded px-3 py-1.5 font-medium transition-colors ${
        active ? "bg-we-red text-white" : "text-we-slate hover:bg-we-canvas"
      }`}
    >
      {children}
    </button>
  );
}

// ── 3.1 Manual Event Creation ────────────────────────────────────────────────

function ManualCreate({ prefill }: { prefill?: Partial<CreateEventInput> }) {
  const router = useRouter();
  const [form, setForm] = useState<CreateEventInput>({
    title: prefill?.title ?? "",
    type: prefill?.type ?? "technical_talk",
    start_at: "",
    end_at: "",
    location: "",
    city: prefill?.city ?? "",
    goal: "",
    target_group: prefill?.target_group ?? "",
    cost: undefined,
    human_capital: "",
    partner_university: "",
  });
  const [busy, setBusy] = useState(false);

  function set<K extends keyof CreateEventInput>(k: K, v: CreateEventInput[K]) {
    setForm((f) => ({ ...f, [k]: v }));
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    const created = await createEvent(form);
    setBusy(false);
    router.push(`/events/${created.id}`);
  }

  return (
    <Card>
      <CardHeader title="New Event" subtitle="These fields drive later comparison & prediction — not just admin." />
      <CardBody>
        <form onSubmit={submit} className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="Title" full>
            <input className={inputCls} value={form.title} onChange={(e) => set("title", e.target.value)} required />
          </Field>
          <Field label="Event type">
            <select className={inputCls} value={form.type} onChange={(e) => set("type", e.target.value as EventType)}>
              {EVENT_TYPES.map((t) => (
                <option key={t} value={t}>
                  {EVENT_TYPE_LABEL[t]}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Partner / University">
            <input className={inputCls} value={form.partner_university} onChange={(e) => set("partner_university", e.target.value)} />
          </Field>
          <Field label="Start">
            <input type="datetime-local" className={inputCls} value={form.start_at} onChange={(e) => set("start_at", e.target.value)} required />
          </Field>
          <Field label="End">
            <input type="datetime-local" className={inputCls} value={form.end_at} onChange={(e) => set("end_at", e.target.value)} required />
          </Field>
          <Field label="City">
            <input className={inputCls} value={form.city} onChange={(e) => set("city", e.target.value)} />
          </Field>
          <Field label="Location">
            <input className={inputCls} value={form.location} onChange={(e) => set("location", e.target.value)} />
          </Field>
          <Field label="Target group">
            <input className={inputCls} value={form.target_group} onChange={(e) => set("target_group", e.target.value)} />
          </Field>
          <Field label="Cost (€)">
            <input type="number" className={inputCls} value={form.cost ?? ""} onChange={(e) => set("cost", e.target.value ? Number(e.target.value) : undefined)} />
          </Field>
          <Field label="Goal" full>
            <input className={inputCls} value={form.goal} onChange={(e) => set("goal", e.target.value)} />
          </Field>
          <Field label="Human capital (owner, effort, follow-up workload, experts…)" full>
            <textarea rows={2} className={inputCls} value={form.human_capital} onChange={(e) => set("human_capital", e.target.value)} />
          </Field>

          <div className="sm:col-span-2 flex justify-end gap-2">
            <Button type="submit" disabled={busy}>
              {busy ? "Creating…" : "Create event"}
            </Button>
          </div>
        </form>
      </CardBody>
    </Card>
  );
}

const inputCls =
  "w-full rounded-md border border-we-line bg-we-canvas px-3 py-2 text-sm outline-none focus:border-we-red focus:bg-we-surface";

function Field({ label, children, full }: { label: string; children: React.ReactNode; full?: boolean }) {
  return (
    <label className={`block ${full ? "sm:col-span-2" : ""}`}>
      <span className="mb-1 block text-xs font-medium text-we-slate">{label}</span>
      {children}
    </label>
  );
}

// ── 3.3 Opportunity Explorer + LLM assistant ─────────────────────────────────

function OpportunityExplorer() {
  const { data, loading } = useAsync(() => getOpportunities(), []);
  const [prompt, setPrompt] = useState("");
  const [reply, setReply] = useState<AssistantReply | null>(null);
  const [thinking, setThinking] = useState(false);

  const examples = [
    "Plan an event for Electrical Engineering students.",
    "Where do we see engagement but no Würth event yet?",
    "Which past event format should we repeat?",
  ];

  async function ask(p: string) {
    setPrompt(p);
    setThinking(true);
    setReply(null);
    const r = await askOpportunityAssistant(p);
    setReply(r);
    setThinking(false);
  }

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
      {/* Assistant */}
      <Card>
        <CardHeader title="Planning Assistant" subtitle="Describe what you want — get database-grounded recommendations with reasoning." />
        <CardBody className="space-y-3">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (prompt.trim()) ask(prompt.trim());
            }}
            className="flex gap-2"
          >
            <input
              className={inputCls}
              placeholder="e.g. I want to host in Munich…"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
            />
            <Button type="submit" disabled={thinking}>
              {thinking ? "…" : "Ask"}
            </Button>
          </form>
          <div className="flex flex-wrap gap-1.5">
            {examples.map((ex) => (
              <button
                key={ex}
                onClick={() => ask(ex)}
                className="rounded-full bg-we-canvas px-2.5 py-1 text-[11px] text-we-slate hover:bg-we-red-soft hover:text-we-red"
              >
                {ex}
              </button>
            ))}
          </div>

          {thinking && <Skeleton className="h-24 w-full" />}
          {reply && (
            <div className="rounded-md border border-we-red-soft bg-we-red-soft p-3.5">
              <div className="text-xs font-medium text-we-red">Recommendation</div>
              <div className="mt-1 text-sm font-semibold text-we-ink">{reply.recommendation}</div>
              <p className="mt-1.5 text-xs leading-relaxed text-we-slate">{reply.reasoning}</p>
            </div>
          )}
        </CardBody>
      </Card>

      {/* Opportunities list */}
      <Card>
        <CardHeader title="Opportunities" subtitle="Untapped universities, formats to repeat, weak formats to redesign." />
        <CardBody className="space-y-2.5">
          {loading && <Skeleton className="h-40 w-full" />}
          {!loading && data && data.length === 0 && <EmptyState title="No opportunities surfaced" />}
          {!loading &&
            data?.map((o) => (
              <div key={o.id} className="rounded-md border border-we-line p-3">
                <div className="text-sm font-semibold text-we-ink">{o.title}</div>
                <p className="mt-1 text-xs text-we-slate">{o.reason}</p>
                <span className="mt-2 inline-block rounded bg-we-canvas px-1.5 py-0.5 text-[10px] uppercase tracking-wide text-we-muted">
                  {o.category.replace(/_/g, " ")}
                </span>
              </div>
            ))}
        </CardBody>
      </Card>
    </div>
  );
}
