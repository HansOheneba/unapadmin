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
  Mail,
  Star,
  LineChart,
  Settings,
  Eye,
  Bike,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/lib/hooks/useAuth";
import { useBadgeCounts } from "@/lib/hooks/useDashboard";

type NavItem = {
  label: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  badgeKey?: "pendingOrders" | "lowStock" | "pendingReviews";
  superAdminOnly?: boolean;
};

const navGroups: { label: string; items: NavItem[] }[] = [
  {
    label: "Overview",
    items: [{ label: "Dashboard", href: "/admin", icon: LayoutDashboard }],
  },
  {
    label: "Commerce",
    items: [
      {
        label: "Orders",
        href: "/admin/orders",
        icon: ShoppingCart,
        badgeKey: "pendingOrders",
      },
      { label: "Customers", href: "/admin/customers", icon: Users },
      {
        label: "Products",
        href: "/admin/products",
        icon: Package,
        badgeKey: "lowStock",
      },
      { label: "Collections", href: "/admin/collections", icon: Layers },
      { label: "Riders", href: "/admin/riders", icon: Bike },
    ],
  },
  {
    label: "Marketing",
    items: [
      { label: "Announcements", href: "/admin/announcements", icon: Megaphone },
      { label: "Newsletter", href: "/admin/newsletter", icon: Mail },
    ],
  },
  {
    label: "Content",
    items: [
      {
        label: "Reviews",
        href: "/admin/reviews",
        icon: Star,
        badgeKey: "pendingReviews",
      },
    ],
  },
  {
    label: "Insights",
    items: [{ label: "Analytics", href: "/admin/analytics", icon: LineChart }],
  },
  {
    label: "System",
    items: [
      {
        label: "Settings",
        href: "/admin/settings",
        icon: Settings,
        superAdminOnly: true,
      },
    ],
  },
];

export function Sidebar() {
  const pathname = usePathname();
  const { isSuperAdmin, isViewer } = useAuth();
  const { data: badges = {
    pendingOrders: 0,
    lowStock: 0,
    pendingReviews: 0,
  } } = useBadgeCounts();

  return (
    <aside className="fixed inset-y-0 left-0 z-40 w-60 bg-black text-white flex flex-col">
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
       
      </div>

      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-5">
        {navGroups.map((group) => {
          const visibleItems = group.items.filter(
            (item) => !item.superAdminOnly || isSuperAdmin,
          );
          if (visibleItems.length === 0) return null;
          return (
            <div key={group.label}>
              <div className="px-3 mb-1.5 text-[10px] tracking-[0.2em] uppercase text-white/40">
                {group.label}
              </div>
              <ul className="space-y-0.5">
                {visibleItems.map((item) => {
                  const isActive =
                    item.href === "/admin"
                      ? pathname === "/admin"
                      : pathname === item.href ||
                        pathname.startsWith(item.href + "/");
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
          );
        })}
      </nav>

      {isViewer && (
        <div className="px-4 py-3 border-t border-white/10 flex items-center gap-2 text-amber-400/90">
          <Eye className="h-3.5 w-3.5 shrink-0" />
          <span className="text-[11px] font-medium">Read-only access</span>
        </div>
      )}
    </aside>
  );
}
