"use client";

import * as React from "react";
import Link from "next/link";
import Image from "next/image";
import { Plus, Search } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/lib/hooks/useAuth";
import { useCollections } from "@/lib/hooks/useCollections";
import { useProductMutations, useProducts } from "@/lib/hooks/useProducts";
import { useSettings } from "@/lib/hooks/useSettings";
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
import { ListPagination } from "@/components/shared/list-pagination";
import { PAGE_SIZE } from "@/lib/constants/pagination";
import { formatMoney } from "@/lib/format";
import { TableBodySkeleton } from "@/components/shared/page-skeletons";

export default function ProductsPage() {
  const { can } = useAuth();
  const [collection, setCollection] = React.useState<string>("all");
  const [stock, setStock] = React.useState<"all" | "in" | "low" | "out">("all");
  const [visibility, setVisibility] = React.useState<
    "all" | "visible" | "hidden"
  >("all");
  const [q, setQ] = React.useState("");
  const [page, setPage] = React.useState(1);
  const [toDelete, setToDelete] = React.useState<string | null>(null);

  const listParams = React.useMemo(
    () => ({
      collectionId: collection === "all" ? undefined : collection,
      stock: stock === "all" ? undefined : stock,
      visibility: visibility === "all" ? undefined : visibility,
      q: q || undefined,
      page,
      pageSize: PAGE_SIZE,
    }),
    [collection, stock, visibility, q, page],
  );

  React.useEffect(() => {
    setPage(1);
  }, [collection, stock, visibility, q]);

  const { data, isLoading } = useProducts(listParams);
  const { data: collections = [] } = useCollections();
  const { data: settings } = useSettings();
  const { toggleVisibility, duplicate, remove } = useProductMutations();

  const products = data?.data ?? [];
  const total = data?.total ?? 0;
  const totalPages = data?.totalPages ?? 1;
  const lowStockThreshold = settings?.lowStockThreshold ?? 5;

  return (
    <div className="space-y-6">
      <div className="flex items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-zinc-900">Products</h1>
          <p className="text-sm text-zinc-500 mt-1">
            {total} product{total === 1 ? "" : "s"}
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
                <TableHead>Active</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableBodySkeleton columns={8} />
              ) : products.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={8}
                    className="text-center py-12 text-zinc-500"
                  >
                    No products match.
                  </TableCell>
                </TableRow>
              ) : (
                products.map((p) => {
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
                        {formatMoney(p.price)}
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
                          checked={p.isActive}
                          disabled={!can("edit") || toggleVisibility.isPending}
                          onCheckedChange={async () => {
                            if (!can("edit")) return;
                            try {
                              await toggleVisibility.mutateAsync(p.id);
                              toast.success(
                                `${p.name} ${p.isActive ? "hidden" : "now active"}`,
                              );
                            } catch (e) {
                              toast.error(
                                e instanceof Error
                                  ? e.message
                                  : "Failed to update visibility.",
                              );
                            }
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
                            disabled={duplicate.isPending}
                            onClick={async () => {
                              try {
                                await duplicate.mutateAsync(p.id);
                                toast.success("Product duplicated.");
                              } catch (e) {
                                toast.error(
                                  e instanceof Error
                                    ? e.message
                                    : "Failed to duplicate product.",
                                );
                              }
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
          <ListPagination
            page={page}
            totalPages={totalPages}
            total={total}
            onPageChange={setPage}
          />
        </CardContent>
      </Card>

      <ConfirmDialog
        open={!!toDelete}
        onOpenChange={(o) => !o && setToDelete(null)}
        title="Delete product?"
        description="This will remove the product from the catalog. Existing orders are unaffected."
        destructive
        confirmText="Delete product"
        onConfirm={async () => {
          if (!toDelete) return;
          try {
            await remove.mutateAsync(toDelete);
            toast.success("Product deleted.");
            setToDelete(null);
          } catch (e) {
            toast.error(
              e instanceof Error ? e.message : "Failed to delete product.",
            );
          }
        }}
      />
    </div>
  );
}
