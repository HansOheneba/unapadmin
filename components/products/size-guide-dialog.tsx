"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import type { SizeGuide } from "@/lib/catalog/size-guides";

export function SizeGuideDialog({ guide }: { guide: SizeGuide }) {
  const hasMeasurements = guide.sizes.some((s) => s.inches && s.cm);

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button type="button" variant="ghost" size="sm" className="h-8 text-xs">
          View size chart
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg p-0 overflow-hidden">
        <DialogHeader className="px-6 pt-6 pb-0">
          {guide.eyebrow && (
            <p className="text-[10px] tracking-[0.2em] uppercase text-zinc-400 mb-1">
              {guide.eyebrow}
            </p>
          )}
          <DialogTitle className="text-lg font-semibold text-zinc-900">
            Size Guide
          </DialogTitle>
        </DialogHeader>

        <div className="px-6 pt-4 pb-4">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-zinc-200">
                <th className="text-left pb-2 text-xs font-medium text-zinc-500 uppercase tracking-wide">
                  Size
                </th>
                {hasMeasurements && (
                  <>
                    <th className="text-center pb-2 text-xs font-medium text-zinc-500 uppercase tracking-wide">
                      Waist (in)
                    </th>
                    <th className="text-center pb-2 text-xs font-medium text-zinc-500 uppercase tracking-wide">
                      Waist (cm)
                    </th>
                  </>
                )}
              </tr>
            </thead>
            <tbody>
              {guide.sizes.map((row, i) => (
                <tr
                  key={row.size}
                  className={i % 2 === 0 ? "bg-zinc-50" : "bg-white"}
                >
                  <td className="py-2.5 pl-2 font-semibold text-zinc-900">
                    {row.size}
                  </td>
                  {hasMeasurements && (
                    <>
                      <td className="py-2.5 text-center text-zinc-600">
                        {row.inches ?? "—"}
                      </td>
                      <td className="py-2.5 text-center text-zinc-600">
                        {row.cm ?? "—"}
                      </td>
                    </>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {hasMeasurements && (
          <div className="px-6 py-4 bg-zinc-50 border-t border-zinc-100">
            <p className="text-[10px] tracking-[0.2em] uppercase text-zinc-500 mb-1">
              How to measure
            </p>
            <p className="text-xs text-zinc-500 leading-relaxed">
              Wrap a soft tape measure around the narrowest part of your natural
              waist, keeping it level and comfortably snug. Use the inches or cm
              column to find your size.
            </p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
