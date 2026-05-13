"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import Image from "next/image";
import {
  LayoutDashboard,
  Layers,
  Package,
  Archive,
  ShoppingCart,
  Users,
  Truck,
  RotateCcw,
  Tag,
  Image as ImageIcon,
  Share2,
  BarChart3,
  Settings,
  ExternalLink,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useDashboardStats } from "@/lib/hooks";

const navGroups = [
  {
    items: [
      { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
      { label: "Collections", href: "/dashboard/collections", icon: Layers },
      { label: "Products", href: "/dashboard/products", icon: Package },
      { label: "Inventory", href: "/dashboard/inventory", icon: Archive, badge: "lowStock" },
      { label: "Orders", href: "/dashboard/orders", icon: ShoppingCart, badge: "pending" },
      { label: "Customers", href: "/dashboard/customers", icon: Users },
      { label: "Deliveries", href: "/dashboard/deliveries", icon: Truck },
      { label: "Returns", href: "/dashboard/returns", icon: RotateCcw, badge: "returns" },
    ],
  },
  {
    items: [
      { label: "Discounts", href: "/dashboard/discounts", icon: Tag },
      { label: "Banners", href: "/dashboard/banners", icon: ImageIcon },
      { label: "Affiliates", href: "/dashboard/affiliates", icon: Share2 },
    ],
  },
  {
    items: [
      { label: "Analytics", href: "/dashboard/analytics", icon: BarChart3 },
      { label: "Settings", href: "/dashboard/settings", icon: Settings },
    ],
  },
];

export function Sidebar() {
  const pathname = usePathname();
  const { data: stats } = useDashboardStats();

  const getBadge = (badge?: string) => {
    if (!badge || !stats) return null;
    if (badge === "lowStock" && stats.lowStockCount > 0)
      return (
        <span className="ml-auto bg-red-500 text-white text-xs rounded-full px-1.5 py-0.5 min-w-5 text-center">
          {stats.lowStockCount}
        </span>
      );
    if (badge === "pending" && stats.pendingOrders > 0)
      return (
        <span className="ml-auto bg-yellow-500 text-white text-xs rounded-full px-1.5 py-0.5 min-w-5 text-center">
          {stats.pendingOrders}
        </span>
      );
    if (badge === "returns" && stats.openReturns > 0)
      return (
        <span className="ml-auto bg-zinc-400 text-white text-xs rounded-full px-1.5 py-0.5 min-w-5 text-center">
          {stats.openReturns}
        </span>
      );
    return null;
  };

  return (
    <aside className="fixed inset-y-0 left-0 z-40 w-60 bg-black flex flex-col">
      {/* Logo */}
      <div className="px-6 py-5 border-b border-zinc-800">
        <Link href="/dashboard">
          <Image
            src="/logos/unap_logo_white.png"
            alt="Unapologetic"
            width={120}
            height={32}
            className="object-contain"
          />
        </Link>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-4">
        {navGroups.map((group, gi) => (
          <div key={gi}>
            {gi > 0 && <div className="border-t border-zinc-800 mb-4" />}
            <ul className="space-y-0.5">
              {group.items.map((item) => {
                const isActive =
                  item.href === "/dashboard"
                    ? pathname === "/dashboard"
                    : pathname.startsWith(item.href);
                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      className={cn(
                        "flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors",
                        isActive
                          ? "bg-zinc-800 text-white"
                          : "text-zinc-400 hover:bg-zinc-800 hover:text-white",
                      )}
                    >
                      <item.icon className="h-4 w-4 shrink-0" />
                      {item.label}
                      {getBadge(item.badge)}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>

      {/* Footer */}
      <div className="border-t border-zinc-800 px-3 py-3 space-y-1">
        <a
          href={process.env.NEXT_PUBLIC_STOREFRONT_URL ?? "http://localhost:3000"}
          target="_blank"
          rel="noreferrer"
          className="flex items-center gap-3 px-3 py-2 rounded-md text-sm text-zinc-400 hover:bg-zinc-800 hover:text-white transition-colors"
        >
          <ExternalLink className="h-4 w-4" />
          Back to Storefront
        </a>
      </div>
    </aside>
  );
}
