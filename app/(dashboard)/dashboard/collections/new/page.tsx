"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { toast } from "sonner";
import { useCreateCollection } from "@/lib/hooks/useCollections";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ImagePicker } from "@/components/shared/image-picker";
import { ImageIcon } from "lucide-react";

export default function NewCollectionPage() {
  const router = useRouter();
  const createCollection = useCreateCollection();
  const [form, setForm] = useState({
    subtitle: "",
    title: "",
    tagline: "",
    featured: "",
    href: "",
    sortOrder: 0,
  });
  const [pickerOpen, setPickerOpen] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.subtitle || !form.title) return;
    const slug = form.subtitle.toLowerCase().replace(/\s+/g, "-");
    createCollection.mutate(
      { ...form, href: form.href || `/collections/${slug}` },
      {
        onSuccess: () => {
          toast.success("Collection created");
          router.push("/dashboard/collections");
        },
        onError: () => toast.error("Failed to create collection"),
      },
    );
  };

  return (
    <div className="max-w-xl space-y-6">
      <h1 className="text-2xl font-semibold text-zinc-900">New Collection</h1>
      <form onSubmit={handleSubmit} className="bg-white border border-zinc-100 rounded-lg p-6 space-y-4">
        <div className="space-y-1.5">
          <Label htmlFor="subtitle">Subtitle</Label>
          <Input
            id="subtitle"
            placeholder="e.g. Sunglasses"
            value={form.subtitle}
            onChange={(e) => setForm({ ...form, subtitle: e.target.value })}
            required
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="title">Title</Label>
          <Input
            id="title"
            placeholder="e.g. The Eclipse Edit"
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
            required
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="tagline">Tagline</Label>
          <Input
            id="tagline"
            placeholder="e.g. See the world differently."
            value={form.tagline}
            onChange={(e) => setForm({ ...form, tagline: e.target.value })}
          />
        </div>
        <div className="space-y-1.5">
          <Label>Cover Image</Label>
          <div className="flex items-center gap-2">
            <Input
              placeholder="/collections/..."
              value={form.featured}
              onChange={(e) => setForm({ ...form, featured: e.target.value })}
            />
            <Button type="button" variant="outline" size="icon" onClick={() => setPickerOpen(true)}>
              <ImageIcon className="h-4 w-4" />
            </Button>
          </div>
          {form.featured && (
            <div className="relative aspect-video rounded overflow-hidden mt-2 border border-zinc-100">
              <Image src={form.featured} alt="Cover" fill className="object-cover" />
            </div>
          )}
        </div>
        <div className="flex gap-3 pt-2">
          <Button type="submit" disabled={createCollection.isPending}>
            {createCollection.isPending ? "Creating..." : "Create Collection"}
          </Button>
          <Button type="button" variant="outline" onClick={() => router.back()}>
            Cancel
          </Button>
        </div>
      </form>
      <ImagePicker
        open={pickerOpen}
        onOpenChange={setPickerOpen}
        onSelect={(url) => setForm({ ...form, featured: url })}
      />
    </div>
  );
}
