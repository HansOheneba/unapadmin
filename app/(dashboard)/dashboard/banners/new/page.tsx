"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { toast } from "sonner";
import { ImageIcon } from "lucide-react";
import { createBanner } from "@/lib/api/banners";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { ImagePicker } from "@/components/shared/image-picker";
import type { BannerPosition } from "@/types";

const POSITIONS: { value: BannerPosition; label: string }[] = [
  { value: "HOME_HERO", label: "Home Hero" },
  { value: "COLLECTIONS_TOP", label: "Collections Top" },
  { value: "PRODUCT_SIDEBAR", label: "Product Sidebar" },
  { value: "ANNOUNCEMENT_BAR", label: "Announcement Bar" },
];

export default function NewBannerPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [form, setForm] = useState({
    title: "",
    subtitle: "",
    ctaText: "",
    ctaHref: "",
    imageUrl: "",
    position: "HOME_HERO" as BannerPosition,
    active: true,
    startsAt: "",
    endsAt: "",
    sortOrder: 0,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await createBanner({
        title: form.title,
        subtitle: form.subtitle || null,
        ctaText: form.ctaText || null,
        ctaHref: form.ctaHref || null,
        imageUrl: form.imageUrl,
        position: form.position,
        active: form.active,
        startsAt: form.startsAt || null,
        endsAt: form.endsAt || null,
        sortOrder: form.sortOrder,
      });
      toast.success("Banner created");
      router.push("/dashboard/banners");
    } catch {
      toast.error("Failed to create banner");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-xl space-y-6">
      <h1 className="text-2xl font-semibold text-zinc-900">New Banner</h1>
      <form onSubmit={handleSubmit} className="bg-white border border-zinc-100 rounded-lg p-6 space-y-4">
        <div className="space-y-1.5">
          <Label htmlFor="title">Title</Label>
          <Input id="title" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="subtitle">Subtitle</Label>
          <Input id="subtitle" value={form.subtitle} onChange={(e) => setForm({ ...form, subtitle: e.target.value })} />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label htmlFor="ctaText">CTA Text</Label>
            <Input id="ctaText" value={form.ctaText} onChange={(e) => setForm({ ...form, ctaText: e.target.value })} placeholder="Shop Now" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="ctaHref">CTA URL</Label>
            <Input id="ctaHref" value={form.ctaHref} onChange={(e) => setForm({ ...form, ctaHref: e.target.value })} placeholder="/collections" />
          </div>
        </div>
        <div className="space-y-1.5">
          <Label>Image</Label>
          <div className="flex items-center gap-2">
            <Input placeholder="/public/..." value={form.imageUrl} onChange={(e) => setForm({ ...form, imageUrl: e.target.value })} required />
            <Button type="button" variant="outline" size="icon" onClick={() => setPickerOpen(true)}>
              <ImageIcon className="h-4 w-4" />
            </Button>
          </div>
          {form.imageUrl && (
            <div className="relative aspect-video rounded overflow-hidden mt-2 border border-zinc-100">
              <Image src={form.imageUrl} alt="Preview" fill className="object-cover" />
            </div>
          )}
        </div>
        <div className="space-y-1.5">
          <Label>Position</Label>
          <Select value={form.position} onValueChange={(v) => setForm({ ...form, position: v as BannerPosition })}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {POSITIONS.map((p) => <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label htmlFor="starts">Start Date</Label>
            <Input id="starts" type="datetime-local" value={form.startsAt} onChange={(e) => setForm({ ...form, startsAt: e.target.value })} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="ends">End Date</Label>
            <Input id="ends" type="datetime-local" value={form.endsAt} onChange={(e) => setForm({ ...form, endsAt: e.target.value })} />
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Switch checked={form.active} onCheckedChange={(v) => setForm({ ...form, active: v })} id="active" />
          <Label htmlFor="active">Active</Label>
        </div>
        <div className="flex gap-3 pt-2">
          <Button type="submit" disabled={loading}>{loading ? "Creating..." : "Create Banner"}</Button>
          <Button type="button" variant="outline" onClick={() => router.back()}>Cancel</Button>
        </div>
      </form>
      <ImagePicker open={pickerOpen} onOpenChange={setPickerOpen} onSelect={(url) => setForm({ ...form, imageUrl: url })} />
    </div>
  );
}
