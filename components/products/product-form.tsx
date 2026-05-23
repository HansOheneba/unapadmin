"use client";

import * as React from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Trash2, Plus, X } from "lucide-react";
import { toast } from "sonner";
import { useAdminStore } from "@/lib/store";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ImagePicker } from "@/components/shared/image-picker";
import type {
  ColorVariant,
  Product,
  ProductCategory,
  ProductTag,
  SizeStock,
} from "@/types";

const CATEGORIES: ProductCategory[] = [
  "boxers",
  "tops",
  "tracks",
  "headwear",
  "sunglasses",
  "hoodies",
  "lingerie",
];

const TAGS: ProductTag[] = ["Essential", "Signature", "Limited", "New"];

const DEFAULT_SIZES = ["S", "M", "L", "XL", "XXL"];

const emptyProduct = (): Product => ({
  id: `prod_${Date.now().toString(36)}`,
  slug: "",
  name: "",
  description: "",
  price: 0,
  compareAtPrice: null,
  category: "boxers",
  tag: "Essential",
  collectionId: "boxers",
  variants: [],
  details: [""],
  careInstructions: [""],
  isVisible: true,
  isFeatured: false,
  totalStock: 0,
  totalSold: 0,
  averageRating: 0,
  reviewCount: 0,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
});

export function ProductForm({ initial }: { initial?: Product }) {
  const router = useRouter();
  const collections = useAdminStore((s) => s.collections);
  const upsertProduct = useAdminStore((s) => s.upsertProduct);
  const deleteProduct = useAdminStore((s) => s.deleteProduct);

  const [draft, setDraft] = React.useState<Product>(initial ?? emptyProduct());

  // Reset draft when editing a different product (e.g. navigating between edit pages).
  const [prevId, setPrevId] = React.useState(initial?.id);
  if (initial && prevId !== initial.id) {
    setPrevId(initial.id);
    setDraft(initial);
  }

  const update = <K extends keyof Product>(key: K, value: Product[K]) =>
    setDraft((d) => ({ ...d, [key]: value }));

  // Variants
  const addVariant = () => {
    const v: ColorVariant = {
      id: `var_${Date.now().toString(36)}`,
      colorName: "",
      colorHex: "#000000",
      images: [],
      sizes: DEFAULT_SIZES.map((s) => ({
        size: s,
        stock: 0,
        sku: `${draft.slug || "sku"}-${s}`,
      })),
    };
    update("variants", [...draft.variants, v]);
  };

  const updateVariant = (idx: number, patch: Partial<ColorVariant>) => {
    update(
      "variants",
      draft.variants.map((v, i) => (i === idx ? { ...v, ...patch } : v)),
    );
  };

  const removeVariant = (idx: number) =>
    update(
      "variants",
      draft.variants.filter((_, i) => i !== idx),
    );

  const updateSize = (vIdx: number, sIdx: number, patch: Partial<SizeStock>) => {
    update(
      "variants",
      draft.variants.map((v, i) =>
        i !== vIdx
          ? v
          : {
              ...v,
              sizes: v.sizes.map((s, si) =>
                si === sIdx ? { ...s, ...patch } : s,
              ),
            },
      ),
    );
  };

  const handleSave = () => {
    if (!draft.name || !draft.slug) {
      toast.error("Name and slug are required.");
      return;
    }
    upsertProduct(draft);
    toast.success(initial ? "Product updated." : "Product created.");
    router.push(`/admin/products/${draft.id}`);
  };

  const handleDelete = () => {
    if (!initial) return;
    if (!confirm("Delete this product?")) return;
    deleteProduct(initial.id);
    toast.success("Product deleted.");
    router.push("/admin/products");
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-zinc-900">
            {initial ? "Edit product" : "New product"}
          </h1>
          <p className="text-sm text-zinc-500 mt-1">
            {initial ? draft.name : "Create a new product for the catalog."}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="ghost" onClick={() => router.push("/admin/products")}>
            Cancel
          </Button>
          {initial && (
            <Button variant="outline" onClick={handleDelete} className="text-rose-600">
              Delete
            </Button>
          )}
          <Button onClick={handleSave}>Save product</Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base font-semibold">Basic info</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Name</Label>
                  <Input
                    value={draft.name}
                    onChange={(e) => update("name", e.target.value)}
                  />
                </div>
                <div>
                  <Label>Slug</Label>
                  <Input
                    value={draft.slug}
                    onChange={(e) => update("slug", e.target.value)}
                    placeholder="signature-boxers"
                  />
                </div>
              </div>
              <div>
                <Label>Description</Label>
                <Textarea
                  rows={4}
                  value={draft.description}
                  onChange={(e) => update("description", e.target.value)}
                />
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <Label>Price</Label>
                  <Input
                    type="number"
                    value={draft.price}
                    onChange={(e) => update("price", Number(e.target.value))}
                  />
                </div>
                <div>
                  <Label>Compare-at price</Label>
                  <Input
                    type="number"
                    value={draft.compareAtPrice ?? ""}
                    onChange={(e) =>
                      update(
                        "compareAtPrice",
                        e.target.value ? Number(e.target.value) : null,
                      )
                    }
                  />
                </div>
                <div>
                  <Label>Tag</Label>
                  <Select
                    value={draft.tag}
                    onValueChange={(v) => update("tag", v as ProductTag)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {TAGS.map((t) => (
                        <SelectItem key={t} value={t}>
                          {t}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Category</Label>
                  <Select
                    value={draft.category}
                    onValueChange={(v) =>
                      update("category", v as ProductCategory)
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {CATEGORIES.map((c) => (
                        <SelectItem key={c} value={c}>
                          {c}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Collection</Label>
                  <Select
                    value={draft.collectionId}
                    onValueChange={(v) => update("collectionId", v)}
                  >
                    <SelectTrigger>
                      <SelectValue />
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
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-base font-semibold">
                Variants ({draft.variants.length})
              </CardTitle>
              <Button size="sm" onClick={addVariant}>
                <Plus className="h-4 w-4" />
                Add color
              </Button>
            </CardHeader>
            <CardContent className="space-y-4">
              {draft.variants.length === 0 && (
                <p className="text-sm text-zinc-500 text-center py-6">
                  No variants yet. Add at least one color.
                </p>
              )}
              {draft.variants.map((v, idx) => (
                <Card key={v.id} className="bg-zinc-50/50">
                  <CardContent className="p-4 space-y-3">
                    <div className="flex items-center gap-2">
                      <Input
                        value={v.colorName}
                        onChange={(e) =>
                          updateVariant(idx, { colorName: e.target.value })
                        }
                        placeholder="Color name"
                        className="flex-1"
                      />
                      <Input
                        type="color"
                        value={v.colorHex}
                        onChange={(e) =>
                          updateVariant(idx, { colorHex: e.target.value })
                        }
                        className="w-16 p-1 h-9"
                      />
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeVariant(idx)}
                        className="text-rose-600"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>

                    <div>
                      <Label>Images</Label>
                      <div className="flex flex-wrap gap-2 mt-1">
                        {v.images.map((img, i) => (
                          <div
                            key={i}
                            className="relative h-16 w-16 rounded overflow-hidden bg-white border border-zinc-200 group"
                          >
                            <Image
                              src={img}
                              alt=""
                              fill
                              sizes="64px"
                              className="object-cover"
                            />
                            <button
                              type="button"
                              onClick={() =>
                                updateVariant(idx, {
                                  images: v.images.filter((_, k) => k !== i),
                                })
                              }
                              className="absolute top-0.5 right-0.5 bg-black/70 text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100"
                            >
                              <X className="h-3 w-3" />
                            </button>
                          </div>
                        ))}
                        <ImagePicker
                          onSelect={(url) =>
                            updateVariant(idx, { images: [...v.images, url] })
                          }
                        />
                      </div>
                    </div>

                    <div>
                      <Label>Sizes & stock</Label>
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Size</TableHead>
                            <TableHead>SKU</TableHead>
                            <TableHead className="text-right">Stock</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {v.sizes.map((s, sIdx) => (
                            <TableRow key={`${v.id}-${sIdx}`}>
                              <TableCell className="w-16">
                                <Input
                                  value={s.size}
                                  onChange={(e) =>
                                    updateSize(idx, sIdx, {
                                      size: e.target.value,
                                    })
                                  }
                                  className="h-8 text-xs"
                                />
                              </TableCell>
                              <TableCell>
                                <Input
                                  value={s.sku}
                                  onChange={(e) =>
                                    updateSize(idx, sIdx, {
                                      sku: e.target.value,
                                    })
                                  }
                                  className="h-8 text-xs font-mono"
                                />
                              </TableCell>
                              <TableCell className="text-right w-24">
                                <Input
                                  type="number"
                                  value={s.stock}
                                  onChange={(e) =>
                                    updateSize(idx, sIdx, {
                                      stock: Number(e.target.value),
                                    })
                                  }
                                  className="h-8 text-xs text-right"
                                />
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base font-semibold">
                Details & care
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <DynamicList
                label="Product details"
                items={draft.details}
                onChange={(items) => update("details", items)}
                placeholder="100% Egyptian cotton"
              />
              <DynamicList
                label="Care instructions"
                items={draft.careInstructions}
                onChange={(items) => update("careInstructions", items)}
                placeholder="Cold machine wash"
              />
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base font-semibold">
                Visibility
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between">
                <Label htmlFor="visible">Visible on storefront</Label>
                <Switch
                  id="visible"
                  checked={draft.isVisible}
                  onCheckedChange={(v) => update("isVisible", v)}
                />
              </div>
              <div className="flex items-center justify-between">
                <Label htmlFor="featured">Featured product</Label>
                <Switch
                  id="featured"
                  checked={draft.isFeatured}
                  onCheckedChange={(v) => update("isFeatured", v)}
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base font-semibold">Stats</CardTitle>
            </CardHeader>
            <CardContent className="text-sm space-y-2 text-zinc-600">
              <Row label="Total stock" value={draft.totalStock} />
              <Row label="Total sold" value={draft.totalSold} />
              <Row label="Reviews" value={draft.reviewCount} />
              <Row
                label="Rating"
                value={draft.averageRating ? draft.averageRating.toFixed(1) : "—"}
              />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

function DynamicList({
  label,
  items,
  onChange,
  placeholder,
}: {
  label: string;
  items: string[];
  onChange: (items: string[]) => void;
  placeholder: string;
}) {
  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <Label>{label}</Label>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onChange([...items, ""])}
        >
          <Plus className="h-3 w-3" /> Add
        </Button>
      </div>
      <div className="space-y-2">
        {items.map((item, i) => (
          <div key={i} className="flex items-center gap-2">
            <Input
              value={item}
              placeholder={placeholder}
              onChange={(e) =>
                onChange(items.map((x, k) => (k === i ? e.target.value : x)))
              }
            />
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onChange(items.filter((_, k) => k !== i))}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        ))}
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-zinc-500">{label}</span>
      <span className="text-zinc-900 font-medium">{value}</span>
    </div>
  );
}
