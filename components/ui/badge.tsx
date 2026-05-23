import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium",
  {
    variants: {
      variant: {
        default: "bg-zinc-100 text-zinc-700",
        amber: "bg-amber-100 text-amber-700",
        yellow: "bg-yellow-100 text-yellow-700",
        blue: "bg-blue-100 text-blue-700",
        indigo: "bg-indigo-100 text-indigo-700",
        violet: "bg-violet-100 text-violet-700",
        purple: "bg-purple-100 text-purple-700",
        emerald: "bg-emerald-100 text-emerald-700",
        green: "bg-green-100 text-green-700",
        red: "bg-red-100 text-red-700",
        rose: "bg-rose-100 text-rose-700",
        zinc: "bg-zinc-100 text-zinc-500",
        orange: "bg-orange-100 text-orange-700",
        outline: "border border-zinc-200 bg-white text-zinc-700",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  },
);

export interface BadgeProps
  extends
    React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  );
}

export { Badge, badgeVariants };
