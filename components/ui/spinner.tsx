import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

export function Spinner({
  className,
  size = "sm",
}: {
  className?: string;
  size?: "sm" | "md" | "lg";
}) {
  const sizeClass =
    size === "lg" ? "h-8 w-8" : size === "md" ? "h-5 w-5" : "h-4 w-4";
  return (
    <Loader2
      aria-hidden
      className={cn("animate-spin text-zinc-400", sizeClass, className)}
    />
  );
}

/** Centered spinner for full-viewport waits (auth bootstrap, etc.). */
export function PageSpinner({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "min-h-screen bg-zinc-50 flex items-center justify-center",
        className,
      )}
    >
      <Spinner size="md" className="text-zinc-500" />
    </div>
  );
}
