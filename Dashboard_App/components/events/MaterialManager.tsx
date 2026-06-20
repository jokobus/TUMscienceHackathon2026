"use client";

import { useState } from "react";
import { getEventMaterials, uploadMaterial } from "@/lib/api";
import { useAsync } from "@/lib/useAsync";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { EmptyState, Skeleton } from "@/components/ui/States";
import { fmtDate } from "@/lib/format";
import type { Material, MaterialType } from "@/lib/types";

const TYPES: MaterialType[] = [
  "slides",
  "pdf",
  "image",
  "link",
  "qa_summary",
  "product_info",
  "project_doc",
  "follow_up_resource",
];

/** Material upload (AGENT §2.3). Real upload is multipart; mock echoes a row. */
export function MaterialManager({ eventId }: { eventId: string }) {
  const { data, loading } = useAsync(() => getEventMaterials(eventId), [eventId]);
  const [items, setItems] = useState<Material[] | null>(null);
  const [title, setTitle] = useState("");
  const [type, setType] = useState<MaterialType>("slides");
  const [busy, setBusy] = useState(false);

  const list = items ?? data ?? [];

  async function handleUpload() {
    if (!title.trim()) return;
    setBusy(true);
    const created = await uploadMaterial(eventId, { title: title.trim(), type, url: "#" });
    setItems([created, ...list]);
    setTitle("");
    setBusy(false);
  }

  return (
    <Card>
      <CardHeader
        title="Materials"
        subtitle="Slides, docs, product info — connectable to the student-facing event page."
      />
      <CardBody className="space-y-3">
        <div className="flex flex-col gap-2 sm:flex-row">
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Material title"
            className="flex-1 rounded-md border border-we-line bg-we-canvas px-3 py-2 text-sm outline-none focus:border-we-red focus:bg-we-surface"
          />
          <select
            value={type}
            onChange={(e) => setType(e.target.value as MaterialType)}
            className="rounded-md border border-we-line bg-we-canvas px-2.5 py-2 text-sm text-we-slate outline-none focus:border-we-red"
          >
            {TYPES.map((t) => (
              <option key={t} value={t}>
                {t.replace(/_/g, " ")}
              </option>
            ))}
          </select>
          <Button onClick={handleUpload} disabled={busy || !title.trim()}>
            {busy ? "Uploading…" : "Upload"}
          </Button>
        </div>

        {loading && <Skeleton className="h-24 w-full" />}
        {!loading && list.length === 0 && (
          <EmptyState title="No materials yet" hint="Upload slides or docs for this event." />
        )}
        {!loading &&
          list.map((m) => (
            <div
              key={m.id}
              className="flex items-center justify-between gap-3 rounded-md border border-we-line px-3 py-2.5"
            >
              <div className="min-w-0">
                <div className="truncate text-sm font-medium text-we-ink">{m.title}</div>
                <div className="text-[11px] text-we-muted">
                  {m.type.replace(/_/g, " ")} · {fmtDate(m.upload_date)} · {m.uploaded_by.display_name}
                </div>
              </div>
              <div className="shrink-0 text-right text-[11px] text-we-slate">
                <div>{m.access_count} views</div>
                <div>{m.download_count} downloads</div>
              </div>
            </div>
          ))}
      </CardBody>
    </Card>
  );
}
