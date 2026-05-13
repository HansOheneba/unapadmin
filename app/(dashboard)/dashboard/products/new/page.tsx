"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense } from "react";
import Image from "next/image";
import { toast } from "sonner";
import { ImageIcon } from "lucide-react";
import { useCollections } from "@/lib/hooks/useCollections";
import { createProduct } from "@/lib/api/products";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ImagePicker } from "@/components/shared/image-picker";

function NewProductForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const defaultCollection = searchParams.get("collectionId") ?? "";
  const { data: collections = [] } = useCollections();
  const [pickerOpen, setPickerOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    name: "",
    description: "",
    price: "",
    priceNum: 0,
    tag: "",
    collectionId: defaultCollection,
    stock: 0,
    lowStockThreshold: 10,
    featuredImage: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await createProduct({
        name: form.name,
        description: form.description,
        price: form.price,
        priceNum: form.priceNum,
        tag: form.tag,
        collectionId: form.collectionId,
        stock: form.stock,
        lowStockThreshold: form.lowStockThreshold,
        images: form.featuredImage
          ? [{ id: "new", url: form.featuredImage, isPrimary: true }]
          : [],
        colors: [],
      });
      toast.success("Product created");
      router.push("/dashboard/products");
    } catch {
      toast.error("Failed to create product");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-xl space-y-6">
      <h1 className="text-2xl font-semibold text-zinc-900">New Product</h1>
      <form
        onSubmit={handleSubmit}
        className="bg-white border border-zinc-100 rounded-lg p-6 space-y-4"
      >
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label htmlFor="name">Name</Label>
            <Input
              id="name"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              required
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="tag">Tag</Label>
            <Input
              id="tag"
              placeholder="Signature, Limited..."
              value={form.tag}
              onChange={(e) => setForm({ ...form, tag: e.target.value })}
            />
          </div>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="description">Description</Label>
          <Textarea
            id="description"
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            rows={3}
          />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label htmlFor="price">Display Price</Label>
            <Input
              id="price"
              placeholder="US$45"
              value={form.price}
              onChange={(e) => setForm({ ...form, price: e.target.value })}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="priceNum">Price (number)</Label>
            <Input
              id="priceNum"
              type="number"
              value={form.priceNum}
              onChange={(e) =>
                setForm({ ...form, priceNum: Number(e.target.value) })
              }
            />
          </div>
        </div>
        <div className="space-y-1.5">
          <Label>Collection</Label>
          <Select
            value={form.collectionId}
            onValueChange={(v) => setForm({ ...form, collectionId: v })}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select collection" />
            </SelectTrigger>
            <SelectContent>
              {collections.map((c) => (
                <SelectItem key={c.id} value={c.id}>
                  {c.subtitle}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label htmlFor="stock">Initial Stock</Label>
            <Input
              id="stock"
              type="number"
              value={form.stock}
              onChange={(e) =>
                setForm({ ...form, stock: Number(e.target.value) })
              }
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="threshold">Low Stock Threshold</Label>
            <Input
              id="threshold"
              type="number"
              value={form.lowStockThreshold}
              onChange={(e) =>
                setForm({ ...form, lowStockThreshold: Number(e.target.value) })
              }
            />
          </div>
        </div>
        <div className="space-y-1.5">
          <Label>Cover Image</Label>
          <div className="flex items-center gap-2">
            <Input
              placeholder="/collections/..."
              value={form.featuredImage}
              onChange={(e) =>
                setForm({ ...form, featuredImage: e.target.value })
              }
            />
            <Button
              type="button"
              variant="outline"
              size="icon"
              onClick={() => setPickerOpen(true)}
            >
              <ImageIcon className="h-4 w-4" />
            </Button>
          </div>
          {form.featuredImage && (
            <div className="relative aspect-video rounded overflow-hidden mt-2 border border-zinc-100">
              <Image
                src={form.featuredImage}
                alt="Cover"
                fill
                className="object-cover"
              />
            </div>
          )}
        </div>
        <div className="flex gap-3 pt-2">
          <Button type="submit" disabled={loading}>
            {loading ? "Creating..." : "Create Product"}
          </Button>
          <Button type="button" variant="outline" onClick={() => router.back()}>
            Cancel
          </Button>
        </div>
      </form>
      <ImagePicker
        open={pickerOpen}
        onOpenChange={setPickerOpen}
        onSelect={(url) => setForm({ ...form, featuredImage: url })}
      />
    </div>
  );
}

export default function NewProductPage() {
  return (
    <Suspense>
      <NewProductForm />
    </Suspense>
  );
}
