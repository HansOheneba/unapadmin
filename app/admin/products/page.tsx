"use client";

import * as React from "react";
import Link from "next/link";
import Image from "next/image";
import { Plus, Search } from "lucide-react";
import { toast } from "sonner";
import { useAdminStore } from "@/lib/store";
import { useAuth } from "@/lib/hooks/useAuth";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
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
import { Switch } from "@/components/ui/switch";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { formatMoney } from "@/lib/format";

export default function ProductsPage() {
  const { can } = useAuth();
  const products = useAdminStore((s) => s.products);
  const collections = useAdminStore((s) => s.collections);
  const lowStockThreshold = useAdminStore((s) => s.settings.lowStockThreshold);
  const toggleVisibility = useAdminStore((s) => s.toggleProductVisibility);
  const duplicateProduct = useAdminStore((s) => s.duplicateProduct);
  const deleteProduct = useAdminStore((s) => s.deleteProduct);

  const [collection, setCollection] = React.useState<string>("all");
  const [stock, setStock] = React.useState<"all" | "in" | "low" | "out">("all");
  const [visibility, setVisibility] = React.useState<
    "all" | "visible" | "hidden"
  >("all");
  const [q, setQ] = React.useState("");
  const [toDelete, setToDelete] = React.useState<string | null>(null);

  const filtered = products.filter((p) => {
    if (collection !== "all" && p.collectionId !== collection) return false;
    if (visibility === "visible" && !p.isVisible) return false;
    if (visibility === "hidden" && p.isVisible) return false;
    if (stock === "out" && p.totalStock > 0) return false;
    if (stock === "in" && p.totalStock <= lowStockThreshold) return false;
    if (
      stock === "low" &&
      (p.totalStock === 0 || p.totalStock > lowStockThreshold)
    )
      return false;
    if (
      q &&
      !p.name.toLowerCase().includes(q.toLowerCase()) &&
      !p.slug.includes(q.toLowerCase())
    )
      return false;
    return true;
  });

  return (
    <div className="space-y-6">
      <div className="flex items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-zinc-900">Products</h1>
          <p className="text-sm text-zinc-500 mt-1">
            {filtered.length} of {products.length} products
          </p>
        </div>
        {can("create") && (
          <Button asChild>
            <Link href="/admin/products/new">
              <Plus className="h-4 w-4" /> New product
            </Link>
          </Button>
        )}
      </div>

      <Card>
        <CardContent className="p-4 grid grid-cols-1 md:grid-cols-5 gap-3">
          <div className="md:col-span-2 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
            <Input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search products..."
              className="pl-9"
            />
          </div>
          <Select value={collection} onValueChange={setCollection}>
            <SelectTrigger>
              <SelectValue placeholder="Collection" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All collections</SelectItem>
              {collections.map((c) => (
                <SelectItem key={c.id} value={c.id}>
                  {c.subtitle}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={stock} onValueChange={(v) => setStock(v as never)}>
            <SelectTrigger>
              <SelectValue placeholder="Stock" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All stock</SelectItem>
              <SelectItem value="in">In stock</SelectItem>
              <SelectItem value="low">Low stock</SelectItem>
              <SelectItem value="out">Out of stock</SelectItem>
            </SelectContent>
          </Select>
          <Select
            value={visibility}
            onValueChange={(v) => setVisibility(v as never)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Visibility" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All visibility</SelectItem>
              <SelectItem value="visible">Visible</SelectItem>
              <SelectItem value="hidden">Hidden</SelectItem>
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Product</TableHead>
                <TableHead>Collection</TableHead>
                <TableHead>Price</TableHead>
                <TableHead>Stock</TableHead>
                <TableHead>Sold</TableHead>
                <TableHead>Visible</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={8}
                    className="text-center py-12 text-zinc-500"
                  >
                    No products match.
                  </TableCell>
                </TableRow>
              ) : (
                filtered.map((p) => {
                  const collectionName =
                    collections.find((c) => c.id === p.collectionId)
                      ?.subtitle ?? p.collectionId;
                  const stockPip =
                    p.totalStock === 0
                      ? "red"
                      : p.totalStock <= lowStockThreshold
                        ? "amber"
                        : "green";
                  return (
                    <TableRow key={p.id}>
                      <TableCell>
                        <Link
                          href={`/admin/products/${p.id}`}
                          className="flex items-center gap-3 hover:underline"
                        >
                          <div className="relative h-10 w-10 rounded overflow-hidden bg-zinc-100">
                            {p.variants[0]?.images[0] && (
                              <Image
                                src={p.variants[0].images[0]}
                                alt=""
                                fill
                                className="object-cover"
                                sizes="40px"
                              />
                            )}
                          </div>
                          <div>
                            <div className="text-sm font-medium text-zinc-900 line-clamp-1">
                              {p.name}
                            </div>
                            <div className="text-xs text-zinc-500">
                              {p.slug}
                            </div>
                          </div>
                        </Link>
                      </TableCell>
                      <TableCell className="text-sm text-zinc-700">
                        {collectionName}
                      </TableCell>
                      <TableCell className="text-sm">
                        {formatMoney(p.price, "GHS")}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <span
                            className={`inline-block h-2 w-2 rounded-full ${
                              stockPip === "red"
                                ? "bg-rose-500"
                                : stockPip === "amber"
                                  ? "bg-amber-500"
                                  : "bg-emerald-500"
                            }`}
                          />
                          <span className="text-sm">{p.totalStock}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-sm text-zinc-600">
                        {p.totalSold}
                      </TableCell>
                      <TableCell>
                        <Switch
                          checked={p.isVisible}
                          disabled={!can("edit")}
                          onCheckedChange={() => {
                            if (!can("edit")) return;
                            toggleVisibility(p.id);
                            toast.success(
                              `${p.name} ${p.isVisible ? "hidden" : "now visible"}`,
                            );
                          }}
                        />
                      </TableCell>
                      <TableCell className="text-right">
                        {can("edit") && (
                          <Button asChild variant="ghost" size="sm">
                            <Link href={`/admin/products/${p.id}`}>Edit</Link>
                          </Button>
                        )}
                        {can("create") && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              const id = duplicateProduct(p.id);
                              if (id) toast.success("Product duplicated.");
                            }}
                          >
                            Duplicate
                          </Button>
                        )}
                        {can("delete") && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setToDelete(p.id)}
                            className="text-rose-600 hover:text-rose-700"
                          >
                            Delete
                          </Button>
                        )}
                        {!can("edit") && (
                          <Button asChild variant="ghost" size="sm">
                            <Link href={`/admin/products/${p.id}`}>View</Link>
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <ConfirmDialog
        open={!!toDelete}
        onOpenChange={(o) => !o && setToDelete(null)}
        title="Delete product?"
        description="This will remove the product from the catalog. Existing orders are unaffected."
        destructive
        confirmText="Delete product"
        onConfirm={() => {
          if (toDelete) {
            deleteProduct(toDelete);
            toast.success("Product deleted.");
            setToDelete(null);
          }
        }}
      />
    </div>
  );
}
