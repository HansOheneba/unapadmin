"use client";

import { useDashboardStats } from "@/lib/hooks";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatusBadge } from "@/components/shared/status-badge";
import { formatCurrency, formatDate } from "@/lib/utils";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";
import Image from "next/image";
import Link from "next/link";
import { TrendingUp, TrendingDown, Package, ShoppingCart, Users, AlertTriangle, RotateCcw } from "lucide-react";

const STATUS_COLORS: Record<string, string> = {
  PENDING: "#EAB308",
  CONFIRMED: "#3B82F6",
  PROCESSING: "#6366F1",
  SHIPPED: "#A855F7",
  DELIVERED: "#22C55E",
  CANCELLED: "#EF4444",
  REFUNDED: "#71717A",
};

function ChangeIndicator({ change }: { change: number }) {
  const positive = change >= 0;
  return (
    <span className={`flex items-center gap-0.5 text-xs ${positive ? "text-green-600" : "text-red-500"}`}>
      {positive ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
      {Math.abs(change).toFixed(1)}%
    </span>
  );
}

export default function DashboardPage() {
  const { data: stats, isLoading } = useDashboardStats();

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-28 bg-white border border-zinc-100 rounded-lg animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  if (!stats) return null;

  const kpis = [
    {
      label: "Total Revenue",
      value: formatCurrency(stats.totalRevenue),
      change: stats.revenueChange,
      icon: <TrendingUp className="h-4 w-4 text-zinc-400" />,
    },
    {
      label: "Orders",
      value: stats.totalOrders.toLocaleString(),
      change: stats.ordersChange,
      icon: <ShoppingCart className="h-4 w-4 text-zinc-400" />,
    },
    {
      label: "Customers",
      value: stats.totalCustomers.toLocaleString(),
      change: stats.customersChange,
      icon: <Users className="h-4 w-4 text-zinc-400" />,
    },
    {
      label: "Pending Orders",
      value: stats.pendingOrders.toLocaleString(),
      change: null,
      icon: <ShoppingCart className="h-4 w-4 text-yellow-500" />,
    },
    {
      label: "Low Stock Items",
      value: stats.lowStockCount.toLocaleString(),
      change: null,
      icon: <AlertTriangle className="h-4 w-4 text-red-500" />,
    },
    {
      label: "Open Returns",
      value: stats.openReturns.toLocaleString(),
      change: null,
      icon: <RotateCcw className="h-4 w-4 text-zinc-400" />,
    },
  ];

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold text-zinc-900">Dashboard</h1>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-4">
        {kpis.map((kpi) => (
          <Card key={kpi.label}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>{kpi.label}</CardTitle>
                {kpi.icon}
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-semibold text-zinc-900">{kpi.value}</div>
              {kpi.change !== null && (
                <div className="mt-1">
                  <ChangeIndicator change={kpi.change} />
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Revenue Chart */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base font-semibold text-zinc-900">
              Revenue (Last 30 Days)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={stats.revenueChart}>
                <XAxis
                  dataKey="date"
                  tick={{ fontSize: 11, fill: "#71717A" }}
                  tickFormatter={(v) => v.slice(5)}
                />
                <YAxis tick={{ fontSize: 11, fill: "#71717A" }} width={60} />
                <Tooltip
                  formatter={(v: unknown) => [formatCurrency(v as number), "Revenue"]}
                  labelFormatter={(l) => formatDate(l)}
                />
                <Line
                  type="monotone"
                  dataKey="revenue"
                  stroke="#000"
                  strokeWidth={2}
                  dot={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Orders by Status */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base font-semibold text-zinc-900">
              Orders by Status
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie
                  data={stats.ordersByStatus}
                  dataKey="count"
                  nameKey="status"
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={80}
                >
                  {stats.ordersByStatus.map((entry) => (
                    <Cell key={entry.status} fill={STATUS_COLORS[entry.status] ?? "#ccc"} />
                  ))}
                </Pie>
                <Legend
                  formatter={(v) => v.charAt(0) + v.slice(1).toLowerCase()}
                  iconSize={8}
                />
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Bottom Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Top Products */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base font-semibold text-zinc-900">Top Products</CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-zinc-100">
                  <th className="text-left py-2 text-xs text-zinc-500 font-medium">Product</th>
                  <th className="text-right py-2 text-xs text-zinc-500 font-medium">Units</th>
                  <th className="text-right py-2 text-xs text-zinc-500 font-medium">Revenue</th>
                </tr>
              </thead>
              <tbody>
                {stats.topProducts.map((p) => (
                  <tr key={p.productId} className="border-b border-zinc-50 hover:bg-zinc-50">
                    <td className="py-2 flex items-center gap-2">
                      <div className="relative h-8 w-8 rounded overflow-hidden shrink-0">
                        <Image src={p.image} alt={p.name} fill className="object-cover" />
                      </div>
                      <span className="text-zinc-800 truncate max-w-40">{p.name}</span>
                    </td>
                    <td className="py-2 text-right text-zinc-600">{p.unitsSold}</td>
                    <td className="py-2 text-right text-zinc-800 font-medium">
                      {formatCurrency(p.revenue)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </CardContent>
        </Card>

        {/* Recent Orders placeholder */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-base font-semibold text-zinc-900">Recent Orders</CardTitle>
              <Link href="/dashboard/orders" className="text-xs text-zinc-500 hover:text-zinc-900">
                View all
              </Link>
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            <p className="text-sm text-zinc-400 py-4 text-center">
              Connect the API to see recent orders.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
