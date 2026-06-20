import { useEffect, useState } from "react";
import { Linking, Pressable, Text, View } from "react-native";
import {
  ExternalLink,
  FileText,
  FolderOpen,
  Image as ImageIcon,
  Link2,
  type LucideIcon,
  Plus,
  Presentation,
} from "lucide-react-native";
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
import { cn, formatDay } from "@/lib/utils";
import { wuerth } from "@/theme";

const typeIcon: Partial<Record<MaterialType, LucideIcon>> = {
  slides: Presentation,
  pdf: FileText,
  image: ImageIcon,
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
    <View className="gap-3">
      <Button variant="secondary" block onPress={() => setOpen(true)} icon={<Plus size={16} color={wuerth.ink} />}>
        Share a file or link
      </Button>

      {!materials ? (
        <ListSkeleton rows={3} />
      ) : materials.length === 0 ? (
        <EmptyState icon={FolderOpen} title="No files yet" description="Share slides, PDFs, product info or links for this event." />
      ) : (
        <Card>
          {materials.map((m, i) => {
            const Icon = typeIcon[m.type] ?? FileText;
            return (
              <Pressable
                key={m.id}
                onPress={() => m.url && m.url !== "#" && Linking.openURL(m.url)}
                className={cn(
                  "flex-row items-center gap-3 p-3 active:bg-zinc-50",
                  i > 0 && "border-t border-wuerth-line"
                )}
              >
                <View className="h-9 w-9 items-center justify-center rounded-xl bg-wuerth-red-soft">
                  <Icon size={17} color={wuerth.red} />
                </View>
                <View className="min-w-0 flex-1">
                  <Text numberOfLines={1} className="text-sm font-semibold text-wuerth-ink">
                    {m.title}
                  </Text>
                  <Text className="text-xs text-wuerth-mute">
                    {m.type.replace(/_/g, " ")} · {formatDay(m.uploadDate)} · {m.accessCount} views
                  </Text>
                </View>
                <ExternalLink size={15} color={wuerth.mute} />
              </Pressable>
            );
          })}
        </Card>
      )}

      <BottomSheet open={open} onClose={() => setOpen(false)} title="Share a file">
        <View className="gap-3">
          <Input label="Title" value={title} onChangeText={setTitle} placeholder="e.g. Briefing slides" />
          <Input label="URL" value={url} onChangeText={setUrl} placeholder="https://…" autoCapitalize="none" />
          <View>
            <Text className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-wuerth-mute">
              Type
            </Text>
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
          </View>
          <Button block onPress={add} loading={saving} disabled={!title.trim()}>
            Share
          </Button>
        </View>
      </BottomSheet>
    </View>
  );
}
