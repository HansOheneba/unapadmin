"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Plus, Search, Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { useProducts } from "@/lib/hooks/useProducts";
import { useDeleteProduct } from "@/lib/hooks/useProducts";
import { useCollections } from "@/lib/hooks/useCollections";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

export default function ProductsPage() {
  const [q, setQ] = useState("");
  const [collectionId, setCollectionId] = useState("");
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const { data: productsData, isLoading } = useProducts({ q, collectionId: collectionId || undefined });
  const { data: collections = [] } = useCollections();
  const deleteProduct = useDeleteProduct();

  const handleDelete = () => {
    if (!deleteId) return;
    deleteProduct.mutate(deleteId, {
      onSuccess: () => { toast.success("Product deleted"); setDeleteId(null); },
      onError: () => toast.error("Failed to delete"),
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-zinc-900">Products</h1>
        <Link href="/dashboard/products/new">
          <Button><Plus className="h-4 w-4 mr-1" />New Product</Button>
        </Link>
      </div>

      <div className="flex gap-3">
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
          <Input
            placeholder="Search products..."
            value={q}
            onChange={(e) => setQ(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={collectionId || "all"} onValueChange={(v) => setCollectionId(v === "all" ? "" : v)}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="All collections" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All collections</SelectItem>
            {collections.map((c) => (
              <SelectItem key={c.id} value={c.id}>{c.subtitle}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="bg-white border border-zinc-100 rounded-lg overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Product</TableHead>
              <TableHead>Collection</TableHead>
              <TableHead>Price</TableHead>
              <TableHead>Tag</TableHead>
              <TableHead>Stock</TableHead>
              <TableHead className="w-20"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={i}>
                  {Array.from({ length: 6 }).map((_, j) => (
                    <TableCell key={j}><div className="h-4 bg-zinc-100 rounded animate-pulse" /></TableCell>
                  ))}
                </TableRow>
              ))
            ) : productsData?.data.map((product) => {
              const collection = collections.find((c) => c.id === product.collectionId);
              const isLow = product.stock <= product.lowStockThreshold;
              return (
                <TableRow key={product.id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div className="relative h-10 w-10 rounded overflow-hidden shrink-0">
                        <Image
                          src={product.images[0]?.url ?? "/logos/unap_logo_black.png"}
                          alt={product.name}
                          fill
                          className="object-cover"
                        />
                      </div>
                      <span className="font-medium text-zinc-900">{product.name}</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-zinc-600">{collection?.subtitle ?? product.collectionId}</TableCell>
                  <TableCell className="text-zinc-900">{product.price}</TableCell>
                  <TableCell><Badge>{product.tag}</Badge></TableCell>
                  <TableCell>
                    <Badge variant={isLow ? "red" : "default"}>
                      {product.stock} {isLow && "LOW"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <Link href={`/dashboard/products/${product.id}`}>
                        <Button variant="ghost" size="icon"><Pencil className="h-4 w-4" /></Button>
                      </Link>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-red-500 hover:text-red-600"
                        onClick={() => setDeleteId(product.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>

      <ConfirmDialog
        open={!!deleteId}
        onOpenChange={(o) => !o && setDeleteId(null)}
        title="Delete Product"
        description="This will permanently delete the product and all its data."
        onConfirm={handleDelete}
        confirmLabel="Delete"
        destructive
        loading={deleteProduct.isPending}
      />
    </div>
  );
}
