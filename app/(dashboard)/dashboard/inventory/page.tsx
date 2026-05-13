"use client";

import { useState } from "react";
import { toast } from "sonner";
import { useInventory, useUpdateInventory } from "@/lib/hooks";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import Image from "next/image";

export default function InventoryPage() {
  const { data: products = [], isLoading } = useInventory();
  const updateInventory = useUpdateInventory();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState("");
  const [showLowStockOnly, setShowLowStockOnly] = useState(false);

  const lowStockCount = products.filter((p) => p.stock <= p.lowStockThreshold).length;
  const filtered = showLowStockOnly
    ? products.filter((p) => p.stock <= p.lowStockThreshold)
    : products;

  const handleStockSave = (productId: string) => {
    const stock = parseInt(editValue, 10);
    if (isNaN(stock) || stock < 0) return;
    const product = products.find((p) => p.id === productId);
    if (!product) return;
    updateInventory.mutate(
      { productId, stock, lowStockThreshold: product.lowStockThreshold },
      {
        onSuccess: () => { toast.success("Stock updated"); setEditingId(null); },
        onError: () => toast.error("Failed to update stock"),
      },
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-zinc-900">Inventory</h1>
        <div className="flex items-center gap-3">
          {lowStockCount > 0 && (
            <button
              onClick={() => setShowLowStockOnly(!showLowStockOnly)}
              className={`text-sm px-3 py-1.5 rounded-md border transition-colors ${
                showLowStockOnly
                  ? "bg-red-50 border-red-200 text-red-700"
                  : "bg-white border-zinc-200 text-zinc-700 hover:bg-zinc-50"
              }`}
            >
              {lowStockCount} low stock items
            </button>
          )}
        </div>
      </div>

      <div className="bg-white border border-zinc-100 rounded-lg overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Product</TableHead>
              <TableHead>Collection</TableHead>
              <TableHead>Stock</TableHead>
              <TableHead>Threshold</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading
              ? Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={i}>
                    {Array.from({ length: 5 }).map((_, j) => (
                      <TableCell key={j}><div className="h-4 bg-zinc-100 rounded animate-pulse" /></TableCell>
                    ))}
                  </TableRow>
                ))
              : filtered.map((product) => {
                  const isLow = product.stock <= product.lowStockThreshold;
                  return (
                    <TableRow key={product.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className="relative h-9 w-9 rounded overflow-hidden shrink-0">
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
                      <TableCell className="text-zinc-600">{product.collectionId}</TableCell>
                      <TableCell>
                        {editingId === product.id ? (
                          <input
                            type="number"
                            value={editValue}
                            onChange={(e) => setEditValue(e.target.value)}
                            onBlur={() => handleStockSave(product.id)}
                            onKeyDown={(e) => {
                              if (e.key === "Enter") handleStockSave(product.id);
                              if (e.key === "Escape") setEditingId(null);
                            }}
                            className="w-20 border border-zinc-200 rounded px-2 py-1 text-sm focus:border-zinc-400 focus:outline-none"
                            autoFocus
                          />
                        ) : (
                          <button
                            onClick={() => { setEditingId(product.id); setEditValue(String(product.stock)); }}
                            className="text-zinc-900 font-medium hover:underline"
                          >
                            {product.stock}
                          </button>
                        )}
                      </TableCell>
                      <TableCell className="text-zinc-600">{product.lowStockThreshold}</TableCell>
                      <TableCell>
                        {isLow ? (
                          <Badge variant="red">LOW</Badge>
                        ) : (
                          <Badge variant="green">OK</Badge>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
