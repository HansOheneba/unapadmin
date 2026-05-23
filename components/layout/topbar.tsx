"use client";

import * as React from "react";
import { Search, LogOut, ShoppingBag, User, Package } from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { useAuthStore } from "@/lib/auth-store";
import { useAdminStore } from "@/lib/store";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";

type SearchResult =
  | { type: "order"; id: string; label: string; sub: string }
  | { type: "customer"; id: string; label: string; sub: string }
  | { type: "product"; id: string; label: string; sub: string };

export function Topbar() {
  const router = useRouter();
  const currentUser = useAuthStore((s) => s.currentUser);
  const logout = useAuthStore((s) => s.logout);
  const orders = useAdminStore((s) => s.orders);
  const customers = useAdminStore((s) => s.customers);
  const products = useAdminStore((s) => s.products);

  const [confirmOpen, setConfirmOpen] = React.useState(false);
  const [q, setQ] = React.useState("");
  const [open, setOpen] = React.useState(false);
  const inputRef = React.useRef<HTMLInputElement>(null);
  const containerRef = React.useRef<HTMLDivElement>(null);

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

  const results: SearchResult[] = (() => {
    const needle = q.trim().toLowerCase();
    if (needle.length < 2) return [];
    const out: SearchResult[] = [];

    for (const o of orders) {
      if (
        o.id.toLowerCase().includes(needle) ||
        o.customerName.toLowerCase().includes(needle) ||
        o.customerEmail.toLowerCase().includes(needle) ||
        o.trackingNumber.toLowerCase().includes(needle)
      ) {
        out.push({
          type: "order",
          id: o.id,
          label: o.id,
          sub: `${o.customerName} - ${o.status}`,
        });
        if (out.filter((r) => r.type === "order").length >= 4) break;
      }
    }

    for (const c of customers) {
      const hay =
        `${c.firstName} ${c.lastName} ${c.email} ${c.phone}`.toLowerCase();
      if (hay.includes(needle)) {
        out.push({
          type: "customer",
          id: c.id,
          label: `${c.firstName} ${c.lastName}`,
          sub: c.email,
        });
        if (out.filter((r) => r.type === "customer").length >= 4) break;
      }
    }

    for (const p of products) {
      if (
        p.name.toLowerCase().includes(needle) ||
        p.slug.toLowerCase().includes(needle)
      ) {
        out.push({
          type: "product",
          id: p.id,
          label: p.name,
          sub: p.collectionId,
        });
        if (out.filter((r) => r.type === "product").length >= 4) break;
      }
    }

    return out;
  })();

  const navigate = (r: SearchResult) => {
    setQ("");
    setOpen(false);
    if (r.type === "order") router.push(`/admin/orders/${r.id}`);
    else if (r.type === "customer") router.push(`/admin/customers/${r.id}`);
    else router.push(`/admin/products/${r.id}`);
  };

  // Close dropdown when clicking outside.
  React.useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const handleConfirmLogout = () => {
    logout();
    toast.success("Signed out.");
    router.push("/login");
  };

  const icons = {
    order: ShoppingBag,
    customer: User,
    product: Package,
  } as const;

  return (
    <>
      <header className="bg-white border-b border-zinc-100 h-14 flex items-center px-6 gap-4 sticky top-0 z-30">
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold text-zinc-900">
            Unapologetic Admin
          </span>
          <Badge variant={env === "LIVE" ? "emerald" : "amber"}>{env}</Badge>
        </div>

        <div className="flex-1 max-w-md" ref={containerRef}>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400 pointer-events-none" />
            <input
              ref={inputRef}
              value={q}
              onChange={(e) => {
                setQ(e.target.value);
                setOpen(true);
              }}
              onFocus={() => setOpen(true)}
              onKeyDown={(e) => {
                if (e.key === "Escape") {
                  setQ("");
                  setOpen(false);
                  inputRef.current?.blur();
                }
              }}
              placeholder="Search orders, customers, products..."
              className="w-full h-9 pl-9 pr-3 rounded-md border border-zinc-200 bg-zinc-50 text-sm placeholder:text-zinc-400 focus:bg-white focus:border-zinc-400 focus:outline-none"
            />
            {open && q.trim().length >= 2 && (
              <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-zinc-200 rounded-lg shadow-lg z-50 overflow-hidden">
                {results.length === 0 ? (
                  <div className="px-4 py-6 text-sm text-zinc-500 text-center">
                    No results for &ldquo;{q}&rdquo;
                  </div>
                ) : (
                  <ul>
                    {results.map((r, i) => {
                      const Icon = icons[r.type];
                      return (
                        <li key={`${r.type}-${r.id}-${i}`}>
                          <button
                            className="w-full flex items-center gap-3 px-4 py-2.5 text-left hover:bg-zinc-50 transition-colors"
                            onMouseDown={(e) => {
                              e.preventDefault();
                              navigate(r);
                            }}
                          >
                            <Icon className="h-4 w-4 text-zinc-400 shrink-0" />
                            <div className="min-w-0">
                              <div className="text-sm font-medium text-zinc-900 truncate">
                                {r.label}
                              </div>
                              <div className="text-xs text-zinc-500 truncate capitalize">
                                {r.sub}
                              </div>
                            </div>
                            <span className="ml-auto text-[10px] text-zinc-400 shrink-0 capitalize">
                              {r.type}
                            </span>
                          </button>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </div>
            )}
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
