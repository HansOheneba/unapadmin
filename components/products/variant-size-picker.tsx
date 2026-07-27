"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SizeGuideDialog } from "@/components/products/size-guide-dialog";
import type { SizeGuide } from "@/lib/catalog/size-guides";
import type { SizeStock } from "@/types";

type Props = {
  guide: SizeGuide;
  sizes: SizeStock[];
  onChange: (sizes: SizeStock[]) => void;
};

export function VariantSizePicker({ guide, sizes, onChange }: Props) {
  const selected = new Map(sizes.map((s) => [s.size, s.stock]));

  const toggle = (size: string) => {
    if (selected.has(size)) {
      onChange(sizes.filter((s) => s.size !== size));
    } else {
      onChange([...sizes, { size, stock: 0 }].sort(
        (a, b) =>
          guide.sizes.findIndex((g) => g.size === a.size) -
          guide.sizes.findIndex((g) => g.size === b.size),
      ));
    }
  };

  const setStock = (size: string, stock: number) => {
    onChange(
      sizes.map((s) =>
        s.size === size ? { ...s, stock: Math.max(0, stock) } : s,
      ),
    );
  };

  const selectAll = () => {
    onChange(
      guide.sizes.map((g) => ({
        size: g.size,
        stock: selected.get(g.size) ?? 0,
      })),
    );
  };

  const clearAll = () => onChange([]);

  const hasMeasurements = guide.sizes.some((s) => s.inches && s.cm);

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <Label className="mb-0">{guide.label} sizes</Label>
          <p className="text-xs text-zinc-500 mt-0.5">
            Pick which sizes this color is available in.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <SizeGuideDialog guide={guide} />
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="h-8 text-xs"
            onClick={selectAll}
          >
            Select all
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="h-8 text-xs"
            onClick={clearAll}
          >
            Clear
          </Button>
        </div>
      </div>

      <div className="rounded-md border border-zinc-200 overflow-hidden">
        <div className="grid grid-cols-[auto_1fr_auto] gap-x-3 gap-y-0 bg-zinc-50 px-3 py-2 text-[10px] font-medium uppercase tracking-wide text-zinc-500 border-b border-zinc-200">
          <span className="w-8" />
          <span>Size</span>
          <span className="w-20 text-right">Stock</span>
        </div>
        {guide.sizes.map((entry, i) => {
          const isOn = selected.has(entry.size);
          const stock = selected.get(entry.size) ?? 0;
          return (
            <div
              key={entry.size}
              className={cn(
                "grid grid-cols-[auto_1fr_auto] gap-x-3 items-center px-3 py-2.5 border-b border-zinc-100 last:border-0",
                i % 2 === 0 ? "bg-white" : "bg-zinc-50/50",
                isOn && "bg-zinc-50",
              )}
            >
              <input
                type="checkbox"
                checked={isOn}
                onChange={() => toggle(entry.size)}
                className="h-4 w-4 rounded border-zinc-300 accent-zinc-900"
                aria-label={`Offer size ${entry.size}`}
              />
              <div className="min-w-0">
                <span className="text-sm font-semibold text-zinc-900">
                  {entry.size}
                </span>
                {hasMeasurements && entry.inches && entry.cm && (
                  <span className="block text-xs text-zinc-500">
                    {entry.inches}&quot; waist · {entry.cm} cm
                  </span>
                )}
              </div>
              <Input
                type="number"
                min={0}
                inputMode="numeric"
                disabled={!isOn}
                value={isOn && stock > 0 ? stock : ""}
                placeholder="0"
                onChange={(e) => {
                  const raw = e.target.value;
                  if (raw === "") {
                    setStock(entry.size, 0);
                    return;
                  }
                  const next = Number(raw);
                  if (Number.isFinite(next)) setStock(entry.size, next);
                }}
                className="h-8 w-20 text-xs text-right"
              />
            </div>
          );
        })}
      </div>

      {sizes.length === 0 && (
        <p className="text-xs text-amber-700">
          Select at least one size for this color.
        </p>
      )}
    </div>
  );
}
