"use client";

import { use, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { toast } from "sonner";
import { ImageIcon, Plus, X, Trash2 } from "lucide-react";
import { useProduct, useUpdateProduct, useDeleteProduct } from "@/lib/hooks/useProducts";
import { useCollections } from "@/lib/hooks/useCollections";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ImagePicker } from "@/components/shared/image-picker";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { Badge } from "@/components/ui/badge";

export default function EditProductPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const { data: product, isLoading } = useProduct(id);
  const { data: collections = [] } = useCollections();
  const updateProduct = useUpdateProduct();
  const deleteProduct = useDeleteProduct();
  const [pickerOpen, setPickerOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  const [form, setForm] = useState({
    name: "",
    description: "",
    price: "",
    priceNum: 0,
    tag: "",
    collectionId: "",
    stock: 0,
    lowStockThreshold: 10,
  });

  useEffect(() => {
    if (product) {
      setForm({
        name: product.name,
        description: product.description,
        price: product.price,
        priceNum: product.priceNum,
        tag: product.tag,
        collectionId: product.collectionId,
        stock: product.stock,
        lowStockThreshold: product.lowStockThreshold,
      });
    }
  }, [product]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateProduct.mutate(
      { id, body: form },
      {
        onSuccess: () => toast.success("Product updated"),
        onError: () => toast.error("Failed to update product"),
      },
    );
  };

  const handleDelete = () => {
    deleteProduct.mutate(id, {
      onSuccess: () => {
        toast.success("Product deleted");
        router.push("/dashboard/products");
      },
      onError: () => toast.error("Failed to delete product"),
    });
  };

  if (isLoading) {
    return <div className="h-48 bg-white border border-zinc-100 rounded-lg animate-pulse" />;
  }

  if (!product) {
    return <div className="text-zinc-500">Product not found.</div>;
  }

  const isLow = product.stock <= product.lowStockThreshold;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-zinc-900">Edit Product</h1>
        <Link href="/dashboard/products">
          <Button variant="outline">Back</Button>
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main form */}
        <form onSubmit={handleSubmit} className="lg:col-span-2 bg-white border border-zinc-100 rounded-lg p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="name">Name</Label>
              <Input id="name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="tag">Tag</Label>
              <Input id="tag" value={form.tag} onChange={(e) => setForm({ ...form, tag: e.target.value })} placeholder="Signature, Limited, Essential..." />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="description">Description</Label>
            <Textarea id="description" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={3} />
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="price">Display Price</Label>
              <Input id="price" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} placeholder="US$45" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="priceNum">Price (number)</Label>
              <Input id="priceNum" type="number" value={form.priceNum} onChange={(e) => setForm({ ...form, priceNum: Number(e.target.value) })} />
            </div>
            <div className="space-y-1.5">
              <Label>Collection</Label>
              <Select value={form.collectionId} onValueChange={(v) => setForm({ ...form, collectionId: v })}>
                <SelectTrigger><SelectValue placeholder="Select collection" /></SelectTrigger>
                <SelectContent>
                  {collections.map((c) => <SelectItem key={c.id} value={c.id}>{c.subtitle}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="stock">Stock</Label>
              <Input id="stock" type="number" value={form.stock} onChange={(e) => setForm({ ...form, stock: Number(e.target.value) })} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="threshold">Low Stock Threshold</Label>
              <Input id="threshold" type="number" value={form.lowStockThreshold} onChange={(e) => setForm({ ...form, lowStockThreshold: Number(e.target.value) })} />
            </div>
          </div>
          <div className="flex items-center gap-4">
            <Button type="submit" disabled={updateProduct.isPending}>
              {updateProduct.isPending ? "Saving..." : "Save Changes"}
            </Button>
            <div className="flex items-center gap-2">
              <span className="text-sm text-zinc-500">Current stock:</span>
              <Badge variant={isLow ? "red" : "green"}>{product.stock} {isLow && "LOW"}</Badge>
            </div>
          </div>
        </form>

        {/* Images & Colors sidebar */}
        <div className="space-y-4">
          <div className="bg-white border border-zinc-100 rounded-lg p-4 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-medium text-zinc-900">Images</h3>
              <Button type="button" variant="outline" size="sm" onClick={() => setPickerOpen(true)}>
                <ImageIcon className="h-4 w-4 mr-1" />
                Add
              </Button>
            </div>
            <div className="grid grid-cols-3 gap-2">
              {product.images.map((img) => (
                <div key={img.id} className="relative aspect-square rounded overflow-hidden group">
                  <Image src={img.url} alt="" fill className="object-cover" />
                  {img.isPrimary && (
                    <div className="absolute bottom-0 left-0 right-0 bg-black/60 text-white text-xs text-center py-0.5">
                      Primary
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white border border-zinc-100 rounded-lg p-4 space-y-3">
            <h3 className="font-medium text-zinc-900">Colors</h3>
            <div className="space-y-2">
              {product.colors.map((color) => (
                <div key={color.id} className="flex items-center gap-2">
                  <div
                    className="h-5 w-5 rounded-full border border-zinc-200 shrink-0"
                    style={{ backgroundColor: color.hex }}
                  />
                  <span className="text-sm text-zinc-700">{color.name}</span>
                  <span className="text-xs text-zinc-400">{color.hex}</span>
                </div>
              ))}
              {product.colors.length === 0 && (
                <p className="text-sm text-zinc-400">No colors added.</p>
              )}
            </div>
          </div>

          {/* Danger zone */}
          <div className="bg-white border border-red-100 rounded-lg p-4 space-y-2">
            <h3 className="font-medium text-red-600">Danger Zone</h3>
            <p className="text-sm text-zinc-500">Permanently delete this product.</p>
            <Button
              type="button"
              variant="destructive"
              size="sm"
              onClick={() => setDeleteDialogOpen(true)}
            >
              <Trash2 className="h-4 w-4 mr-1" />
              Delete Product
            </Button>
          </div>
        </div>
      </div>

      <ImagePicker
        open={pickerOpen}
        onOpenChange={setPickerOpen}
        onSelect={(url) => toast.info(`Image picker: ${url} (wire to API when ready)`)}
      />

      <ConfirmDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        title="Delete Product"
        description="This will permanently delete this product and all its data. This cannot be undone."
        onConfirm={handleDelete}
        confirmLabel="Delete"
        destructive
        loading={deleteProduct.isPending}
      />
    </div>
  );
}
