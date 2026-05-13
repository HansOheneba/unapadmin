"use client";

import { usePathname } from "next/navigation";
import { Bell } from "lucide-react";
import { Button } from "@/components/ui/button";

function formatSegment(seg: string) {
  return seg.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

export function Topbar() {
  const pathname = usePathname();
  const segments = pathname.split("/").filter(Boolean);

  const breadcrumbs = segments.map((seg, i) => ({
    label: formatSegment(seg),
    href: "/" + segments.slice(0, i + 1).join("/"),
  }));

  const pageTitle = breadcrumbs[breadcrumbs.length - 1]?.label ?? "Dashboard";

  return (
    <header className="bg-white border-b border-zinc-100 h-14 flex items-center px-6 gap-4">
      {/* Breadcrumb */}
      <div className="flex items-center gap-1 text-sm text-zinc-500 flex-1">
        {breadcrumbs.map((crumb, i) => (
          <span key={crumb.href} className="flex items-center gap-1">
            {i > 0 && <span>/</span>}
            <span
              className={
                i === breadcrumbs.length - 1 ? "text-zinc-900 font-medium" : ""
              }
            >
              {crumb.label}
            </span>
          </span>
        ))}
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="icon">
          <Bell className="h-4 w-4" />
        </Button>
      </div>
    </header>
  );
}
