"use client";

import * as React from "react";
import Link from "next/link";
import Image from "next/image";
import { ArrowDown, ArrowUp, Eye, EyeOff, Plus } from "lucide-react";
import { toast } from "sonner";
import { useAdminStore } from "@/lib/store";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { ImagePicker } from "@/components/shared/image-picker";
import type { Collection } from "@/types";

const emptyCollection = (): Collection => ({
  id: "",
  subtitle: "",
  title: "",
  tagline: "",
  featured: "",
  href: "",
  isVisible: true,
  sortOrder: 0,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
});

export default function CollectionsPage() {
  const collections = useAdminStore((s) => s.collections);
  const products = useAdminStore((s) => s.products);
  const upsert = useAdminStore((s) => s.upsertCollection);
  const remove = useAdminStore((s) => s.deleteCollection);
  const reorder = useAdminStore((s) => s.reorderCollections);

  const [editing, setEditing] = React.useState<Collection | null>(null);
  const [toDelete, setToDelete] = React.useState<string | null>(null);

  const sorted = [...collections].sort((a, b) => a.sortOrder - b.sortOrder);

  const move = (idx: number, dir: -1 | 1) => {
    const next = [...sorted];
    const target = idx + dir;
    if (target < 0 || target >= next.length) return;
    [next[idx], next[target]] = [next[target], next[idx]];
    reorder(next.map((c) => c.id));
  };

  const productCount = (id: string) =>
    products.filter((p) => p.collectionId === id).length;

  return (
    <div className="space-y-6">
      <div className="flex items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-zinc-900">Collections</h1>
          <p className="text-sm text-zinc-500 mt-1">
            Sort order controls the storefront layout (even = hero left, odd = right).
          </p>
        </div>
        <Button onClick={() => setEditing(emptyCollection())}>
          <Plus className="h-4 w-4" /> New collection
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {sorted.map((c, i) => (
          <Card key={c.id} className="overflow-hidden">
            <div className="relative aspect-4/3 bg-zinc-100">
              {c.featured && (
                <Image
                  src={c.featured}
                  alt={c.title}
                  fill
                  sizes="(max-width:1024px) 50vw, 33vw"
                  className="object-cover"
                />
              )}
              <div className="absolute top-2 left-2 right-2 flex items-center justify-between">
                <div className="flex items-center gap-1">
                  <Button
                    size="icon"
                    variant="outline"
                    className="h-7 w-7 bg-white/90"
                    onClick={() => move(i, -1)}
                    disabled={i === 0}
                  >
                    <ArrowUp className="h-3.5 w-3.5" />
                  </Button>
                  <Button
                    size="icon"
                    variant="outline"
                    className="h-7 w-7 bg-white/90"
                    onClick={() => move(i, 1)}
                    disabled={i === sorted.length - 1}
                  >
                    <ArrowDown className="h-3.5 w-3.5" />
                  </Button>
                </div>
                <div className="rounded-full bg-white/90 px-2 py-0.5 text-[10px] font-medium text-zinc-700">
                  #{i + 1}
                </div>
              </div>
            </div>
            <CardContent className="p-4">
              <div className="text-[10px] tracking-[0.2em] uppercase text-zinc-500">
                {c.subtitle}
              </div>
              <div className="mt-1 text-base font-semibold text-zinc-900">
                {c.title}
              </div>
              <p className="mt-1 text-xs text-zinc-500 line-clamp-2">
                {c.tagline}
              </p>
              <div className="mt-3 flex items-center justify-between text-xs">
                <span className="text-zinc-500">
                  {productCount(c.id)} products
                </span>
                <span
                  className={
                    c.isVisible ? "text-emerald-600" : "text-zinc-400"
                  }
                >
                  {c.isVisible ? "Visible" : "Hidden"}
                </span>
              </div>
              <div className="mt-3 flex items-center gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  className="flex-1"
                  onClick={() => setEditing(c)}
                >
                  Edit
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  className="text-rose-600"
                  onClick={() => setToDelete(c.id)}
                >
                  Delete
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {editing && (
        <CollectionEditor
          collection={editing}
          onClose={() => setEditing(null)}
          onSave={(c) => {
            const id = c.id || c.subtitle.toLowerCase().replace(/\s+/g, "-");
            const sortOrder =
              c.sortOrder ||
              (collections.length === 0
                ? 1
                : Math.max(...collections.map((x) => x.sortOrder)) + 1);
            upsert({
              ...c,
              id,
              href: c.href || `/collections/${id}`,
              sortOrder,
            });
            toast.success("Collection saved.");
            setEditing(null);
          }}
        />
      )}

      <ConfirmDialog
        open={!!toDelete}
        onOpenChange={(o) => !o && setToDelete(null)}
        title="Delete collection?"
        description="Products in this collection will be left unassigned."
        destructive
        confirmText="Delete collection"
        onConfirm={() => {
          if (toDelete) {
            remove(toDelete);
            toast.success("Collection deleted.");
            setToDelete(null);
          }
        }}
      />
    </div>
  );
}

function CollectionEditor({
  collection,
  onClose,
  onSave,
}: {
  collection: Collection;
  onClose: () => void;
  onSave: (c: Collection) => void;
}) {
  const [draft, setDraft] = React.useState(collection);
  const u = <K extends keyof Collection>(k: K, v: Collection[K]) =>
    setDraft((d) => ({ ...d, [k]: v }));

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>
            {collection.id ? "Edit collection" : "New collection"}
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Subtitle (eyebrow)</Label>
              <Input
                value={draft.subtitle}
                onChange={(e) => u("subtitle", e.target.value)}
                placeholder="Boxers"
              />
            </div>
            <div>
              <Label>Title (display)</Label>
              <Input
                value={draft.title}
                onChange={(e) => u("title", e.target.value)}
                placeholder="The Signature Line"
              />
            </div>
          </div>
          <div>
            <Label>Tagline</Label>
            <Textarea
              rows={2}
              value={draft.tagline}
              onChange={(e) => u("tagline", e.target.value)}
              placeholder="One sentence describing the collection."
            />
          </div>
          <div>
            <Label>Cover image</Label>
            <div className="flex items-center gap-3">
              {draft.featured && (
                <div className="relative h-20 w-28 rounded overflow-hidden bg-zinc-100">
                  <Image
                    src={draft.featured}
                    alt=""
                    fill
                    sizes="112px"
                    className="object-cover"
                  />
                </div>
              )}
              <ImagePicker
                onSelect={(url) => u("featured", url)}
                trigger={
                  <Button type="button" variant="outline">
                    {draft.featured ? "Change image" : "Choose image"}
                  </Button>
                }
              />
            </div>
          </div>
          <div className="flex items-center justify-between">
            <Label htmlFor="visible">Visible on storefront</Label>
            <Switch
              id="visible"
              checked={draft.isVisible}
              onCheckedChange={(v) => u("isVisible", v)}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={() => onSave(draft)}>Save</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
