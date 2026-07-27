"use client";

import * as React from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Trash2, Plus, X } from "lucide-react";
import { toast } from "sonner";
import { useCollections } from "@/lib/hooks/useCollections";
import { useProductMutations, useProducts } from "@/lib/hooks/useProducts";
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ImagePicker } from "@/components/shared/image-picker";
import { VariantSizePicker } from "@/components/products/variant-size-picker";
import {
  getSizeGuide,
  sizeGuideSizeLabels,
} from "@/lib/catalog/size-guides";
import type { ColorVariant, Product, SizeStock } from "@/types";

const filterSizesForGuide = (
  sizes: SizeStock[],
  collectionSlug: string,
): SizeStock[] => {
  const allowed = new Set(sizeGuideSizeLabels(getSizeGuide(collectionSlug)));
  return sizes.filter((s) => allowed.has(s.size));
};

const toSlug = (name: string) =>
  name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

const emptyProduct = (collectionId = ""): Product => ({
  id: "",
  slug: "",
  name: "",
  description: "",
  price: 0,
  priceNgn: null,
  gender: "male",
  collectionId,
  variants: [],
  details: [""],
  careInstructions: [""],
  isActive: true,
  totalStock: 0,
  totalSold: 0,
  averageRating: 0,
  reviewCount: 0,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
});

export function ProductForm({ initial }: { initial?: Product }) {
  const router = useRouter();
  const { data: productsPage } = useProducts();
  const { data: collections = [] } = useCollections();
  const { upsert, remove } = useProductMutations();
  const products = productsPage?.data ?? [];

  const [draft, setDraft] = React.useState<Product>(
    initial
      ? { ...initial, priceNgn: initial.priceNgn ?? null }
      : emptyProduct(),
  );
  const [slugManuallyEdited, setSlugManuallyEdited] = React.useState(!!initial);
  const [confirmOpen, setConfirmOpen] = React.useState(false);
  // blob: preview URL → File. Uploaded only when the product is saved.
  const localFilesRef = React.useRef(new Map<string, File>());

  // Once collections load, default a new product to the first real collection id
  // (UUID from API) — Postman create requires collectionId, not a slug like "underwear".
  React.useEffect(() => {
    if (initial) return;
    if (draft.collectionId) return;
    if (collections.length === 0) return;
    setDraft((d) => ({ ...d, collectionId: collections[0].id }));
  }, [initial, draft.collectionId, collections]);

  React.useEffect(() => {
    const files = localFilesRef.current;
    return () => {
      for (const url of files.keys()) {
        URL.revokeObjectURL(url);
      }
      files.clear();
    };
  }, []);

  // Reset draft when editing a different product (e.g. navigating between edit pages).
  const [prevId, setPrevId] = React.useState(initial?.id);
  if (initial && prevId !== initial.id) {
    setPrevId(initial.id);
    setDraft(initial);
    setSlugManuallyEdited(true);
  }

  const slugConflict =
    draft.slug !== "" &&
    products.some((p) => p.slug === draft.slug && p.id !== draft.id);

  const collectionKey = (collectionId: string) => {
    const collection = collections.find((c) => c.id === collectionId);
    // Size guides key off storefront slugs (underwear, tops, …). Prefer href
    // path segment; fall back to id when mocks still use slug-as-id.
    const fromHref = collection?.href?.split("/").filter(Boolean).at(-1);
    return fromHref || collectionId;
  };
  const sizeGuide = getSizeGuide(collectionKey(draft.collectionId));

  const update = <K extends keyof Product>(key: K, value: Product[K]) =>
    setDraft((d) => ({ ...d, [key]: value }));

  const updateCollection = (collectionId: string) => {
    const key = collectionKey(collectionId);
    setDraft((d) => ({
      ...d,
      collectionId,
      variants: d.variants.map((v) => ({
        ...v,
        sizes: filterSizesForGuide(v.sizes, key),
      })),
    }));
  };

  // Variants
  const addVariant = () => {
    const v: ColorVariant = {
      id: `var_${Date.now().toString(36)}`,
      colorName: "",
      colorHex: "#000000",
      images: [],
      sizes: [],
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

  const normalizeVariants = (variants: ColorVariant[]): ColorVariant[] =>
    variants.map((v) => {
      const colorName = v.colorName.trim();
      const id =
        v.id.startsWith("var_") && colorName
          ? toSlug(colorName)
          : v.id || (colorName ? toSlug(colorName) : v.id);
      return {
        ...v,
        id,
        colorName,
        sizes: filterSizesForGuide(
          v.sizes.map((s) => ({ ...s, size: s.size.trim() })),
          collectionKey(draft.collectionId),
        ),
      };
    });

  const validateDraft = (): ColorVariant[] | null => {
    if (!draft.name || !draft.slug) {
      toast.error("Name and slug are required.");
      return null;
    }
    if (!draft.price || draft.price <= 0) {
      toast.error("Enter a GHS price greater than 0.");
      return null;
    }
    if (draft.priceNgn != null && draft.priceNgn <= 0) {
      toast.error("NGN price must be greater than 0.");
      return null;
    }
    if (slugConflict) {
      toast.error("Slug is already used by another product.");
      return null;
    }
    if (!draft.collectionId) {
      toast.error("Select a collection.");
      return null;
    }
    if (draft.variants.length === 0) {
      toast.error("Add at least one color variant.");
      return null;
    }
    const variants = normalizeVariants(draft.variants);
    for (const v of variants) {
      if (!v.colorName) {
        toast.error("Every variant needs a color name.");
        return null;
      }
      if (v.sizes.length === 0) {
        toast.error(`${v.colorName} needs at least one size.`);
        return null;
      }
    }
    return variants;
  };

  const requestSave = () => {
    if (!validateDraft()) return;
    setConfirmOpen(true);
  };

  const handleSave = async () => {
    const variants = validateDraft();
    if (!variants) return;

    const product = { ...draft, variants };
    const uploads = variants.flatMap((v, variantIndex) =>
      v.images.flatMap((src, imageIndex) => {
        const file = localFilesRef.current.get(src);
        return file ? [{ variantIndex, imageIndex, file }] : [];
      }),
    );

    try {
      const saved = await upsert.mutateAsync({ product, uploads });
      for (const url of localFilesRef.current.keys()) {
        URL.revokeObjectURL(url);
      }
      localFilesRef.current.clear();
      setConfirmOpen(false);
      toast.success(initial ? "Product updated." : "Product created.");
      router.push(`/admin/products/${saved.id}`);
    } catch (e) {
      toast.error(
        e instanceof Error ? e.message : "Failed to save product.",
      );
    }
  };

  const collectionLabel =
    collections.find((c) => c.id === draft.collectionId)?.subtitle ??
    draft.collectionId;
  const confirmVariants = normalizeVariants(draft.variants);
  const confirmTotalStock = confirmVariants.reduce(
    (sum, v) => sum + v.sizes.reduce((s, size) => s + size.stock, 0),
    0,
  );
  const saveLabel = initial ? "Save product" : "Create product";

  const handleDelete = async () => {
    if (!initial) return;
    if (!confirm("Delete this product?")) return;
    try {
      await remove.mutateAsync(initial.id);
      toast.success("Product deleted.");
      router.push("/admin/products");
    } catch (e) {
      toast.error(
        e instanceof Error ? e.message : "Failed to delete product.",
      );
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-zinc-900">
          {initial ? "Edit product" : "New product"}
        </h1>
        <p className="text-sm text-zinc-500 mt-1">
          {initial ? draft.name : "Create a new product for the catalog."}
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base font-semibold">
                Basic info
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Name</Label>
                  <Input
                    value={draft.name}
                    onChange={(e) => {
                      const name = e.target.value;
                      update("name", name);
                      if (!slugManuallyEdited) {
                        update("slug", toSlug(name));
                      }
                    }}
                  />
                </div>
                <div>
                  <Label>Slug</Label>
                  <Input
                    value={draft.slug}
                    onChange={(e) => {
                      setSlugManuallyEdited(true);
                      update("slug", e.target.value);
                    }}
                    placeholder="signature-boxers"
                    className={
                      slugConflict
                        ? "border-amber-400 focus-visible:ring-amber-400"
                        : ""
                    }
                  />
                  {slugConflict && (
                    <p className="text-xs text-amber-600 mt-1">
                      This slug is already used by another product.
                    </p>
                  )}
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
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-w-lg">
                <div>
                  <Label>Price (GHS)</Label>
                  <Input
                    type="number"
                    inputMode="numeric"
                    min={1}
                    step={1}
                    placeholder="e.g. 120"
                    value={draft.price > 0 ? draft.price : ""}
                    onChange={(e) => {
                      const raw = e.target.value;
                      if (raw === "") {
                        update("price", 0);
                        return;
                      }
                      const next = Number(raw);
                      if (Number.isFinite(next)) update("price", next);
                    }}
                  />
                </div>
                <div>
                  <Label className="text-zinc-500">NGN</Label>
                  <Input
                    type="number"
                    inputMode="numeric"
                    min={1}
                    step={1}
                    placeholder="—"
                    value={
                      draft.priceNgn != null && draft.priceNgn > 0
                        ? draft.priceNgn
                        : ""
                    }
                    onChange={(e) => {
                      const raw = e.target.value;
                      if (raw === "") {
                        update("priceNgn", null);
                        return;
                      }
                      const next = Number(raw);
                      if (Number.isFinite(next)) update("priceNgn", next);
                    }}
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 gap-3">
                <div>
                  <Label>Collection</Label>
                  <Select
                    value={draft.collectionId}
                    onValueChange={updateCollection}
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
              {draft.variants.map((v, idx) => {
                const isOnlyVariant = draft.variants.length === 1;
                return (
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
                        {isOnlyVariant ? (
                          <span className="shrink-0 text-xs text-zinc-400 px-2">
                            Only color
                          </span>
                        ) : (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => removeVariant(idx)}
                            className="text-rose-600"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </div>

                      <div>
                        <Label>Images</Label>
                        <div className="flex flex-wrap gap-2 mt-1">
                          {v.images.map((img, i) => (
                            <div
                              key={img}
                              className="relative h-16 w-16 rounded overflow-hidden bg-white border border-zinc-200 group"
                            >
                              {img.startsWith("blob:") ? (
                                // Local preview until Save — next/image rejects blob: URLs.
                                // eslint-disable-next-line @next/next/no-img-element
                                <img
                                  src={img}
                                  alt=""
                                  className="absolute inset-0 h-full w-full object-cover"
                                />
                              ) : (
                                <Image
                                  src={img}
                                  alt=""
                                  fill
                                  sizes="64px"
                                  className="object-cover"
                                />
                              )}
                              <button
                                type="button"
                                onClick={() => {
                                  if (img.startsWith("blob:")) {
                                    URL.revokeObjectURL(img);
                                    localFilesRef.current.delete(img);
                                  }
                                  updateVariant(idx, {
                                    images: v.images.filter((_, k) => k !== i),
                                  });
                                }}
                                className="absolute top-0.5 right-0.5 bg-black/70 text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100"
                              >
                                <X className="h-3 w-3" />
                              </button>
                            </div>
                          ))}
                          <ImagePicker
                            deferUpload
                            onSelect={(url) =>
                              updateVariant(idx, { images: [...v.images, url] })
                            }
                            onSelectFile={(file) => {
                              const previewUrl = URL.createObjectURL(file);
                              localFilesRef.current.set(previewUrl, file);
                              updateVariant(idx, {
                                images: [...v.images, previewUrl],
                              });
                            }}
                          />
                        </div>
                      </div>

                      <VariantSizePicker
                        guide={sizeGuide}
                        sizes={v.sizes}
                        onChange={(sizes) => updateVariant(idx, { sizes })}
                      />
                    </CardContent>
                  </Card>
                );
              })}
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
                Publishing
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between">
                <Label htmlFor="active">Active on storefront</Label>
                <Switch
                  id="active"
                  checked={draft.isActive}
                  onCheckedChange={(v) => update("isActive", v)}
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
                value={
                  draft.averageRating ? draft.averageRating.toFixed(1) : "—"
                }
              />
            </CardContent>
          </Card>
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-zinc-200 pt-6">
        <div>
          {initial && (
            <Button
              variant="outline"
              onClick={handleDelete}
              className="text-rose-600"
              disabled={upsert.isPending || remove.isPending}
            >
              Delete
            </Button>
          )}
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            onClick={() => router.push("/admin/products")}
            disabled={upsert.isPending}
          >
            Cancel
          </Button>
          <Button onClick={requestSave} disabled={upsert.isPending}>
            {saveLabel}
          </Button>
        </div>
      </div>

      <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {initial ? "Confirm update" : "Confirm create"}
            </DialogTitle>
            <DialogDescription>
              Quick check before {initial ? "saving changes" : "creating this product"}.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 text-sm">
            <SummaryRow label="Name" value={draft.name || "—"} />
            <SummaryRow label="Slug" value={draft.slug || "—"} />
            <SummaryRow label="Collection" value={collectionLabel || "—"} />
            <SummaryRow
              label="Price"
              value={
                draft.priceNgn != null && draft.priceNgn > 0
                  ? `₵${draft.price} · ₦${draft.priceNgn}`
                  : `₵${draft.price}`
              }
            />
            <SummaryRow
              label="Status"
              value={draft.isActive ? "Active" : "Inactive"}
            />
            <SummaryRow
              label="Stock"
              value={`${confirmTotalStock} across ${confirmVariants.length} color${confirmVariants.length === 1 ? "" : "s"}`}
            />
            <div className="rounded-md border border-zinc-200 bg-zinc-50 px-3 py-2 space-y-2">
              <p className="text-xs font-medium uppercase tracking-wide text-zinc-500">
                Variants
              </p>
              {confirmVariants.length === 0 ? (
                <p className="text-zinc-500">None</p>
              ) : (
                confirmVariants.map((v) => (
                  <div key={v.id} className="flex items-start gap-2">
                    <span
                      className="mt-1 h-3 w-3 shrink-0 rounded-full border border-zinc-200"
                      style={{ backgroundColor: v.colorHex }}
                      aria-hidden
                    />
                    <div className="min-w-0">
                      <p className="font-medium text-zinc-900">
                        {v.colorName || "Untitled"}
                      </p>
                      <p className="text-xs text-zinc-500">
                        {v.images.length} image{v.images.length === 1 ? "" : "s"}
                        {" · "}
                        {v.sizes.length === 0
                          ? "No sizes"
                          : v.sizes
                              .map((s) => `${s.size}×${s.stock}`)
                              .join(", ")}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setConfirmOpen(false)}
              disabled={upsert.isPending}
            >
              Back
            </Button>
            <Button onClick={handleSave} loading={upsert.isPending}>
              {saveLabel}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
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

function SummaryRow({
  label,
  value,
}: {
  label: string;
  value: React.ReactNode;
}) {
  return (
    <div className="flex items-start justify-between gap-4">
      <span className="text-zinc-500 shrink-0">{label}</span>
      <span className="text-zinc-900 font-medium text-right">{value}</span>
    </div>
  );
}
