"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useMemo, useState } from "react";
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
  return (
    <Suspense fallback={<div className="mx-auto max-w-5xl"><Skeleton className="h-96 w-full rounded-card" /></div>}>
      <CreateContent />
    </Suspense>
  );
}

function CreateContent() {
  const searchParams = useSearchParams();
  const prefill = useMemo(() => prefillFromSearch(searchParams), [searchParams]);
  const reason = searchParams.get("reason") ?? "";
  const [tab, setTab] = useState<Tab>("manual");

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <PageHeader
        eyebrow="Planning"
        title="Create"
        subtitle="Create a new event manually, or explore future opportunities with the planning assistant."
      />

      <div className="flex gap-1 rounded-md border border-we-line bg-we-surface p-1 text-sm">
        <TabButton active={tab === "manual"} onClick={() => setTab("manual")}>
          Build Event
        </TabButton>
        <TabButton active={tab === "explorer"} onClick={() => setTab("explorer")}>
          Opportunity Explorer
        </TabButton>
      </div>

      {tab === "manual" && <BuildEvent prefill={prefill} reason={reason} />}
      {tab === "explorer" && <OpportunityExplorer />}
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
    partner_university: prefill?.partner_university ?? "",
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

function BuildEvent({
  prefill,
  reason,
}: {
  prefill: Partial<CreateEventInput>;
  reason: string;
}) {
  const router = useRouter();
  const [form, setForm] = useState<CreateEventInput>({
    title: prefill.title ?? "",
    type: prefill.type ?? "technical_talk",
    start_at: "",
    end_at: "",
    location: prefill.location ?? "",
    city: prefill.city ?? prefill.location ?? "",
    goal: reason || prefill.goal || "",
    target_group: prefill.target_group ?? "",
    cost: undefined,
    human_capital: "",
    partner_university: prefill.partner_university ?? "",
  });
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);

  const questions = [
    { id: "date", label: "When should this happen?", field: "start_at" as const, placeholder: "e.g. early July, after exams" },
    { id: "audience", label: "Who exactly should attend?", field: "target_group" as const, placeholder: "e.g. EE master students, embedded systems" },
    { id: "format", label: "What should students do there?", field: "goal" as const, placeholder: "hands-on lab, tech talk, recruiting clinic" },
    { id: "resources", label: "Which Wuerth team can host it?", field: "human_capital" as const, placeholder: "owner, experts, prep effort" },
  ];

  const baseCompleteness = [
    form.title,
    form.type,
    form.location || form.city,
    form.target_group,
    form.goal,
    form.start_at,
    form.end_at,
    form.human_capital,
  ].filter(Boolean).length;
  const progress = Math.min(100, Math.round((baseCompleteness / 8) * 100));
  const nextQuestion = questions.find((q) => !answers[q.id]);

  function set<K extends keyof CreateEventInput>(k: K, v: CreateEventInput[K]) {
    setForm((f) => ({ ...f, [k]: v }));
  }

  function answerCurrent(value: string) {
    if (!nextQuestion || !value.trim()) return;
    setAnswers((a) => ({ ...a, [nextQuestion.id]: value.trim() }));
    const field = nextQuestion.field;
    set(field, value.trim() as CreateEventInput[typeof field]);
    if (field === "start_at" && !form.end_at) {
      set("end_at", value.trim());
    }
    setMessage("");
  }

  async function submit() {
    setBusy(true);
    const created = await createEvent(form);
    setBusy(false);
    router.push(`/events/${created.id}`);
  }

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_380px]">
      <Card>
        <CardHeader
          eyebrow="Build Event"
          title="New Event"
          subtitle="Recommendations prefill what they know. The chat asks follow-up questions and updates this build."
        />
        <CardBody className="space-y-5">
          <div>
            <div className="mb-2 flex items-center justify-between text-sm">
              <span className="font-semibold text-we-ink">Event readiness</span>
              <span className="tnum font-semibold text-we-red">{progress}%</span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-we-canvas">
              <div className="h-full bg-we-red transition-all duration-300" style={{ width: `${progress}%` }} />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label="Title" full>
              <input className={inputCls} value={form.title} onChange={(e) => set("title", e.target.value)} />
            </Field>
            <Field label="Type">
              <select className={inputCls} value={form.type} onChange={(e) => set("type", e.target.value as EventType)}>
                {EVENT_TYPES.map((t) => (
                  <option key={t} value={t}>
                    {EVENT_TYPE_LABEL[t]}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Location">
              <input className={inputCls} value={form.location} onChange={(e) => set("location", e.target.value)} />
            </Field>
            <Field label="Target group">
              <input className={inputCls} value={form.target_group} onChange={(e) => set("target_group", e.target.value)} />
            </Field>
            <Field label="Partner / University">
              <input className={inputCls} value={form.partner_university} onChange={(e) => set("partner_university", e.target.value)} />
            </Field>
            <Field label="Start">
              <input type="datetime-local" className={inputCls} value={form.start_at} onChange={(e) => set("start_at", e.target.value)} />
            </Field>
            <Field label="End">
              <input type="datetime-local" className={inputCls} value={form.end_at} onChange={(e) => set("end_at", e.target.value)} />
            </Field>
            <Field label="Goal" full>
              <textarea rows={3} className={inputCls} value={form.goal} onChange={(e) => set("goal", e.target.value)} />
            </Field>
            <Field label="Human capital" full>
              <textarea rows={2} className={inputCls} value={form.human_capital} onChange={(e) => set("human_capital", e.target.value)} />
            </Field>
          </div>

          <div className="flex justify-end">
            <Button type="button" onClick={submit} disabled={busy || progress < 65}>
              {busy ? "Creating..." : "Create planned event"}
            </Button>
          </div>
        </CardBody>
      </Card>

      <Card className="h-fit">
        <CardHeader title="Planning Chat" subtitle="Answers here fill the event draft on the left." />
        <CardBody className="space-y-4">
          {reason && (
            <div className="rounded-card border border-we-line bg-we-canvas p-3">
              <div className="eyebrow mb-1">Why recommended</div>
              <p className="text-sm leading-relaxed text-we-slate">{reason}</p>
            </div>
          )}

          <div className="space-y-3">
            <AssistantBubble>
              {nextQuestion
                ? nextQuestion.label
                : "This is ready enough to create. You can still adjust the draft before submitting."}
            </AssistantBubble>
            {nextQuestion && (
              <form
                className="flex gap-2"
                onSubmit={(e) => {
                  e.preventDefault();
                  answerCurrent(message);
                }}
              >
                <input
                  className={inputCls}
                  placeholder={nextQuestion.placeholder}
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                />
                <Button type="submit" variant="secondary">
                  Add
                </Button>
              </form>
            )}
          </div>

          <div className="space-y-2 border-t border-we-line pt-4">
            {questions.map((q) => (
              <div key={q.id} className="flex items-start justify-between gap-3 text-sm">
                <span className="text-we-muted">{q.label}</span>
                <span className={`text-right font-semibold ${answers[q.id] ? "text-we-ink" : "text-we-faint"}`}>
                  {answers[q.id] ? "Set" : "Open"}
                </span>
              </div>
            ))}
          </div>
        </CardBody>
      </Card>
    </div>
  );
}

function AssistantBubble({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-card border border-we-line bg-white p-4 text-sm leading-relaxed text-we-ink shadow-card">
      {children}
    </div>
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

function prefillFromSearch(params: Pick<URLSearchParams, "get">): Partial<CreateEventInput> {
  const type = params.get("type");
  const location = params.get("location") ?? "";
  const targetGroup = params.get("target_group") ?? "";

  return {
    title: params.get("title") ?? "",
    type: isEventType(type) ? type : undefined,
    location,
    city: location,
    target_group: targetGroup,
    partner_university: targetGroup,
    goal: params.get("reason") ?? "",
  };
}

function isEventType(value: string | null): value is EventType {
  return !!value && EVENT_TYPES.includes(value as EventType);
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
