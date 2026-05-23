"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  ShoppingCart,
  Users,
  Package,
  Layers,
  Megaphone,
  Crown,
  Star,
  LineChart,
  Settings,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAdminStore } from "@/lib/store";

type NavItem = {
  label: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  badgeKey?: "pendingOrders" | "lowStock" | "pendingReviews" | "innerCirclePending";
};

const navGroups: { label: string; items: NavItem[] }[] = [
  {
    label: "Overview",
    items: [{ label: "Dashboard", href: "/admin", icon: LayoutDashboard }],
  },
  {
    label: "Commerce",
    items: [
      { label: "Orders", href: "/admin/orders", icon: ShoppingCart, badgeKey: "pendingOrders" },
      { label: "Customers", href: "/admin/customers", icon: Users },
      { label: "Products", href: "/admin/products", icon: Package, badgeKey: "lowStock" },
      { label: "Collections", href: "/admin/collections", icon: Layers },
    ],
  },
  {
    label: "Marketing",
    items: [
      { label: "Announcements", href: "/admin/announcements", icon: Megaphone },
      { label: "Inner Circle", href: "/admin/inner-circle", icon: Crown, badgeKey: "innerCirclePending" },
    ],
  },
  {
    label: "Content",
    items: [
      { label: "Reviews", href: "/admin/reviews", icon: Star, badgeKey: "pendingReviews" },
    ],
  },
  {
    label: "Insights",
    items: [{ label: "Analytics", href: "/admin/analytics", icon: LineChart }],
  },
  {
    label: "System",
    items: [{ label: "Settings", href: "/admin/settings", icon: Settings }],
  },
];

export function Sidebar() {
  const pathname = usePathname();
  const orders = useAdminStore((s) => s.orders);
  const products = useAdminStore((s) => s.products);
  const reviews = useAdminStore((s) => s.reviews);
  const innerCircle = useAdminStore((s) => s.innerCircle);
  const lowStockThreshold = useAdminStore((s) => s.settings.lowStockThreshold);

  const badges = {
    pendingOrders: orders.filter(
      (o) => o.status === "pending" || o.status === "processing",
    ).length,
    lowStock: products.reduce(
      (n, p) =>
        n +
        (p.variants.some((v) =>
          v.sizes.some((s) => s.stock > 0 && s.stock <= lowStockThreshold),
        )
          ? 1
          : 0),
      0,
    ),
    pendingReviews: reviews.filter((r) => r.status === "pending").length,
    innerCirclePending: innerCircle.filter((m) => m.status === "pending").length,
  };

  return (
    <aside className="fixed inset-y-0 left-0 z-40 w-60 bg-zinc-900 text-white flex flex-col">
      <div className="px-6 py-5 border-b border-white/10">
        <Link href="/admin" className="flex items-center gap-2">
          <Image
            src="/logos/unapologeticWhite.png"
            alt="Unapologetic"
            width={160}
            height={24}
            className="object-contain"
            priority
          />
        </Link>
        <p className="mt-1 text-[10px] tracking-[0.2em] uppercase text-white/40">
          Admin
        </p>
      </div>

      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-5">
        {navGroups.map((group) => (
          <div key={group.label}>
            <div className="px-3 mb-1.5 text-[10px] tracking-[0.2em] uppercase text-white/40">
              {group.label}
            </div>
            <ul className="space-y-0.5">
              {group.items.map((item) => {
                const isActive =
                  item.href === "/admin"
                    ? pathname === "/admin"
                    : pathname === item.href || pathname.startsWith(item.href + "/");
                const badge = item.badgeKey ? badges[item.badgeKey] : 0;
                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      className={cn(
                        "flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors",
                        isActive
                          ? "bg-white/10 text-white"
                          : "text-white/70 hover:bg-white/5 hover:text-white",
                      )}
                    >
                      <item.icon className="h-4 w-4 shrink-0" />
                      <span className="flex-1">{item.label}</span>
                      {badge > 0 && (
                        <span className="ml-auto rounded-full bg-amber-500/90 text-zinc-900 text-[10px] font-semibold px-1.5 py-0.5 min-w-5 text-center">
                          {badge}
                        </span>
                      )}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>
    </aside>
  );
}
