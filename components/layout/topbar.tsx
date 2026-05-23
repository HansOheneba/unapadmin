"use client";

import { Search } from "lucide-react";
import { useAdminStore } from "@/lib/store";
import { Badge } from "@/components/ui/badge";

export function Topbar() {
  const settings = useAdminStore((s) => s.settings);
  const env =
    process.env.NEXT_PUBLIC_ENV?.toUpperCase() === "LIVE" ? "LIVE" : "STAGING";

  return (
    <header className="bg-white border-b border-zinc-100 h-14 flex items-center px-6 gap-4 sticky top-0 z-30">
      <div className="flex items-center gap-2">
        <span className="text-sm font-semibold text-zinc-900">
          Unapologetic Admin
        </span>
        <Badge variant={env === "LIVE" ? "emerald" : "amber"}>{env}</Badge>
      </div>

      <div className="flex-1 max-w-md">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
          <input
            placeholder="Search orders, customers, products..."
            className="w-full h-9 pl-9 pr-3 rounded-md border border-zinc-200 bg-zinc-50 text-sm placeholder:text-zinc-400 focus:bg-white focus:border-zinc-400 focus:outline-none"
          />
        </div>
      </div>

      <div className="ml-auto flex items-center gap-3">
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-full bg-zinc-900 text-white flex items-center justify-center text-xs font-medium">
            HO
          </div>
          <div className="hidden md:block text-sm leading-tight">
            <div className="font-medium text-zinc-900">Hans Opoku</div>
            <div className="text-xs text-zinc-500">Super Admin</div>
          </div>
        </div>
      </div>
    </header>
  );
}
