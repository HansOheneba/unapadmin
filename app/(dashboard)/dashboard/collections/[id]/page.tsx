"use client";

import { use, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { toast } from "sonner";
import { Plus, Pencil, ImageIcon } from "lucide-react";
import { useCollections, useUpdateCollection } from "@/lib/hooks/useCollections";
import { useProducts } from "@/lib/hooks/useProducts";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ImagePicker } from "@/components/shared/image-picker";
import { Badge } from "@/components/ui/badge";

export default function EditCollectionPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const { data: collections = [] } = useCollections();
  const updateCollection = useUpdateCollection();
  const { data: productsData } = useProducts({ collectionId: id });
  const [pickerOpen, setPickerOpen] = useState(false);

  const collection = collections.find((c) => c.id === id);
  const [form, setForm] = useState({
    subtitle: "",
    title: "",
    tagline: "",
    featured: "",
  });

  useEffect(() => {
    if (collection) {
      setForm({
        subtitle: collection.subtitle,
        title: collection.title,
        tagline: collection.tagline,
        featured: collection.featured,
      });
    }
  }, [collection]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateCollection.mutate(
      { id, body: form },
      {
        onSuccess: () => toast.success("Collection updated"),
        onError: () => toast.error("Failed to update collection"),
      },
    );
  };

  if (!collection) {
    return (
      <div className="text-zinc-500">
        Loading collection...
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-zinc-900">Edit Collection</h1>
        <Link href="/dashboard/collections">
          <Button variant="outline">Back</Button>
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <form onSubmit={handleSubmit} className="bg-white border border-zinc-100 rounded-lg p-6 space-y-4 h-fit">
          <div className="space-y-1.5">
            <Label htmlFor="subtitle">Subtitle</Label>
            <Input
              id="subtitle"
              value={form.subtitle}
              onChange={(e) => setForm({ ...form, subtitle: e.target.value })}
              required
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="title">Title</Label>
            <Input
              id="title"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              required
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="tagline">Tagline</Label>
            <Input
              id="tagline"
              value={form.tagline}
              onChange={(e) => setForm({ ...form, tagline: e.target.value })}
            />
          </div>
          <div className="space-y-1.5">
            <Label>Cover Image</Label>
            <div className="flex items-center gap-2">
              <Input
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
          <Button type="submit" disabled={updateCollection.isPending}>
            {updateCollection.isPending ? "Saving..." : "Save Changes"}
          </Button>
        </form>

        {/* Products in this collection */}
        <div className="bg-white border border-zinc-100 rounded-lg p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold text-zinc-900">Products</h2>
            <Link href={`/dashboard/products/new?collectionId=${id}`}>
              <Button size="sm">
                <Plus className="h-4 w-4 mr-1" />
                Add Product
              </Button>
            </Link>
          </div>
          <div className="space-y-2">
            {productsData?.data.map((product) => (
              <div
                key={product.id}
                className="flex items-center gap-3 p-2 rounded hover:bg-zinc-50"
              >
                <div className="relative h-10 w-10 rounded overflow-hidden shrink-0">
                  <Image
                    src={product.images[0]?.url ?? "/logos/unap_logo_black.png"}
                    alt={product.name}
                    fill
                    className="object-cover"
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-zinc-900 truncate">{product.name}</p>
                  <p className="text-xs text-zinc-500">{product.price}</p>
                </div>
                <Badge variant={product.stock <= product.lowStockThreshold ? "red" : "default"}>
                  {product.stock} in stock
                </Badge>
                <Link href={`/dashboard/products/${product.id}`}>
                  <Button variant="ghost" size="icon">
                    <Pencil className="h-4 w-4" />
                  </Button>
                </Link>
              </div>
            ))}
            {productsData?.data.length === 0 && (
              <p className="text-sm text-zinc-400 py-4 text-center">No products in this collection yet.</p>
            )}
          </div>
        </div>
      </div>

      <ImagePicker
        open={pickerOpen}
        onOpenChange={setPickerOpen}
        onSelect={(url) => setForm({ ...form, featured: url })}
      />
    </div>
  );
}
