"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

function Progress({
  value = 0,
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement> & { value?: number }) {
  const clamped = Math.min(100, Math.max(0, value));
  return (
    <div
      role="progressbar"
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={Math.round(clamped)}
      className={cn(
        "relative h-2 w-full overflow-hidden rounded-full bg-zinc-200",
        className,
      )}
      {...props}
    >
      <div
        className="h-full bg-zinc-900 transition-[width] duration-150 ease-out"
        style={{ width: `${clamped}%` }}
      />
    </div>
  );
}

export { Progress };
