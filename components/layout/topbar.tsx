"use client";

import * as React from "react";
import { Search, LogOut } from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { useAuthStore } from "@/lib/auth-store";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";

export function Topbar() {
  const router = useRouter();
  const currentUser = useAuthStore((s) => s.currentUser);
  const logout = useAuthStore((s) => s.logout);
  const [confirmOpen, setConfirmOpen] = React.useState(false);
  const env =
    process.env.NEXT_PUBLIC_ENV?.toUpperCase() === "LIVE" ? "LIVE" : "STAGING";

  const initials = currentUser
    ? currentUser.name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .slice(0, 2)
        .toUpperCase()
    : "?";

  const roleLabel =
    currentUser?.role === "super_admin"
      ? "Super Admin"
      : currentUser?.role === "admin"
        ? "Admin"
        : "Viewer";

  const handleConfirmLogout = () => {
    logout();
    toast.success("Signed out.");
    router.push("/login");
  };

  return (
    <>
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
            <div className="h-8 w-8 rounded-full bg-zinc-900 text-white flex items-center justify-center text-xs font-medium select-none">
              {initials}
            </div>
            <div className="hidden md:block text-sm leading-tight">
              <div className="font-medium text-zinc-900">
                {currentUser?.name ?? "Unknown"}
              </div>
              <div className="text-xs text-zinc-500">{roleLabel}</div>
            </div>
          </div>
          <button
            onClick={() => setConfirmOpen(true)}
            title="Sign out"
            className="h-8 w-8 flex items-center justify-center rounded-md text-zinc-400 hover:text-zinc-700 hover:bg-zinc-100 transition-colors"
          >
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </header>

      <ConfirmDialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        title="Sign out?"
        description={`You are signed in as ${currentUser?.name ?? ""}. You will be redirected to the login page.`}
        confirmText="Sign out"
        onConfirm={handleConfirmLogout}
      />
    </>
  );
}
