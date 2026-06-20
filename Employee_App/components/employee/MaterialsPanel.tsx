"use client";

import { useEffect, useState } from "react";
import { ExternalLink, FileText, FolderOpen, Image, Link2, Plus, Presentation } from "lucide-react";
import type { Material, MaterialType } from "@/lib/types";
import * as api from "@/lib/api";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { BottomSheet } from "@/components/ui/BottomSheet";
import { SegmentedControl } from "@/components/ui/SegmentedControl";
import { EmptyState } from "@/components/ui/EmptyState";
import { ListSkeleton } from "@/components/ui/Skeleton";
import { useToast } from "@/components/ui/Toast";
import { formatDay } from "@/lib/utils";

const typeIcon: Partial<Record<MaterialType, typeof FileText>> = {
  slides: Presentation,
  pdf: FileText,
  image: Image,
  link: Link2,
  qa_summary: FileText,
  product_info: FileText,
  project_doc: FileText,
  follow_up_resource: FileText,
};

export function MaterialsPanel({ eventId }: { eventId: string }) {
  const { toast } = useToast();
  const [materials, setMaterials] = useState<Material[] | null>(null);
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [url, setUrl] = useState("");
  const [type, setType] = useState<MaterialType>("link");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    api.getMaterials(eventId).then(setMaterials);
  }, [eventId]);

  async function add() {
    if (!title.trim()) return;
    setSaving(true);
    const m = await api.addMaterial(eventId, { title: title.trim(), url: url.trim(), type });
    setMaterials((prev) => [...(prev ?? []), m]);
    setSaving(false);
    setOpen(false);
    setTitle("");
    setUrl("");
    setType("link");
    toast("File shared ✓");
  }

  return (
    <div className="space-y-3">
      <Button variant="secondary" block onClick={() => setOpen(true)}>
        <Plus size={16} /> Share a file or link
      </Button>

      {!materials ? (
        <ListSkeleton rows={3} />
      ) : materials.length === 0 ? (
        <EmptyState icon={FolderOpen} title="No files yet" description="Share slides, PDFs, product info or links for this event." />
      ) : (
        <Card className="divide-y divide-wuerth-line">
          {materials.map((m) => {
            const Icon = typeIcon[m.type] ?? FileText;
            return (
              <a
                key={m.id}
                href={m.url}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-3 p-3 hover:bg-zinc-50"
              >
                <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-wuerth-red-soft text-wuerth-red">
                  <Icon size={17} />
                </span>
                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm font-semibold text-wuerth-ink">{m.title}</div>
                  <div className="text-xs text-wuerth-mute">
                    {m.type.replace(/_/g, " ")} · {formatDay(m.uploadDate)} · {m.accessCount} views
                  </div>
                </div>
                <ExternalLink size={15} className="text-wuerth-mute" />
              </a>
            );
          })}
        </Card>
      )}

      <BottomSheet open={open} onClose={() => setOpen(false)} title="Share a file">
        <div className="space-y-3">
          <Input label="Title" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Briefing slides" />
          <Input label="URL" value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://…" />
          <div>
            <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-wuerth-mute">Type</span>
            <SegmentedControl<MaterialType>
              scroll
              segments={[
                { value: "link", label: "Link" },
                { value: "slides", label: "Slides" },
                { value: "pdf", label: "PDF" },
                { value: "product_info", label: "Product" },
              ]}
              value={type}
              onChange={setType}
            />
          </div>
          <Button block onClick={add} loading={saving} disabled={!title.trim()}>
            Share
          </Button>
        </div>
      </BottomSheet>
    </div>
  );
}
