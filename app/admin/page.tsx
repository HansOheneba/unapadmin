"use client";

import * as React from "react";
import Link from "next/link";
import Image from "next/image";
import { ArrowUpRight, ArrowDownRight, TrendingUp } from "lucide-react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  Pie,
  PieChart,
  XAxis,
  YAxis,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
} from "@/components/ui/chart";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { OrderStatusBadge } from "@/components/shared/status-badge";
import { useDashboardStats } from "@/lib/hooks/useDashboard";
import { useProducts } from "@/lib/hooks/useProducts";
import { useSettings } from "@/lib/hooks/useSettings";
import {
  fmtDate,
  formatMoney,
  formatNumber,
  relative,
  statusLabel,
} from "@/lib/format";
import { DashboardSkeleton } from "@/components/shared/page-skeletons";

const CHART_PALETTE = [
  "#3b82f6",
  "#10b981",
  "#f59e0b",
  "#8b5cf6",
  "#ec4899",
  "#06b6d4",
  "#f97316",
  "#6366f1",
  "#84cc16",
  "#14b8a6",
];

const STATUS_COLORS: Record<string, string> = {
  processing: "#3b82f6",
  ready_for_pickup: "#f59e0b",
  picked_up: "#6366f1",
  in_transit: "#8b5cf6",
  delivered: "#10b981",
  returned: "#dc2626",
  cancelled: "#64748b",
  refunded: "#f43f5e",
};

function chartColor(index: number) {
  return CHART_PALETTE[index % CHART_PALETTE.length];
}

function shortDate(value: string) {
  return fmtDate(value).replace(/,\s*\d{4}$/, "");
}

export default function DashboardPage() {
  const {
    data: stats,
    isLoading,
    isError,
    error,
    refetch,
  } = useDashboardStats();
  const { data: settings } = useSettings();
  const { data: lowStockPage } = useProducts({ stock: "low" });

  const lowStockThreshold = settings?.lowStockThreshold ?? 5;

  const lowStockRows = React.useMemo(() => {
    const products = lowStockPage?.data ?? [];
    return products.flatMap((p) =>
      p.variants.flatMap((v) =>
        v.sizes
          .filter((s) => s.stock > 0 && s.stock <= lowStockThreshold)
          .map((s) => ({
            productId: p.id,
            productName: p.name,
            color: v.colorName,
            size: s.size,
            stock: s.stock,
            image: v.images[0],
          })),
      ),
    );
  }, [lowStockPage?.data, lowStockThreshold]);

  if (isLoading) {
    return <DashboardSkeleton />;
  }

  if (isError || !stats) {
    return (
      <div className="py-12 text-center space-y-3">
        <p className="text-sm text-rose-600">
          {error instanceof Error
            ? error.message
            : "Failed to load dashboard."}
        </p>
        <Button variant="outline" onClick={() => refetch()}>
          Retry
        </Button>
      </div>
    );
  }

  const pctChange = (cur: number, prev: number) =>
    prev === 0 ? (cur > 0 ? 100 : 0) : ((cur - prev) / prev) * 100;

  const revenueChangePct = pctChange(
    stats.revenueThisMonthGhs,
    stats.revenuePrevMonthGhs,
  );
  const ordersChangePct = pctChange(
    stats.recentOrders.length,
    Math.max(stats.recentOrders.length - 1, 1),
  );

  const {
    revenueThisMonthGhs,
    ordersToday,
    activeCustomers,
    pendingAndProcessingOrders,
    lowStockCount,
    aovThisMonthGhs,
    revenueChart,
    ordersByStatus,
    topProducts,
    recentOrders,
    salesByCountry,
  } = stats;

  const statusChart = ordersByStatus
    .map((s) => ({
      status: s.status,
      label: statusLabel(s.status),
      count: s.count,
      fill: STATUS_COLORS[s.status] ?? "#71717a",
    }))
    .sort((a, b) => b.count - a.count);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-zinc-900">Dashboard</h1>
        <p className="text-sm text-zinc-500 mt-1">
          Live snapshot of orders, customers, and inventory.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        <MetricCard
          label="Revenue (Month)"
          value={formatMoney(revenueThisMonthGhs)}
          changePct={revenueChangePct}
        />
        <MetricCard label="Orders Today" value={formatNumber(ordersToday)} />
        <MetricCard
          label="Active Customers"
          value={formatNumber(activeCustomers)}
          hint="Last 90 days"
        />
        <MetricCard
          label="Pending Orders"
          value={formatNumber(pendingAndProcessingOrders)}
          hint="In fulfillment"
        />
        <MetricCard
          label="Low Stock Alerts"
          value={formatNumber(lowStockCount)}
          hint={`Units ≤ ${lowStockThreshold}`}
        />
        <MetricCard
          label="Avg Order Value"
          value={formatMoney(aovThisMonthGhs)}
          hint="GHS orders this month"
          changePct={ordersChangePct}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base font-semibold">
              Revenue (last 30 days)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ChartContainer
              config={{
                ghs: { label: "Ghana", color: "#10b981" },
                ngn: { label: "Nigeria", color: "#3b82f6" },
              }}
              className="h-72"
            >
              <LineChart data={revenueChart} margin={{ left: 8, right: 16 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis
                  dataKey="date"
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={shortDate}
                  minTickGap={32}
                />
                <YAxis hide />
                <ChartTooltip
                  content={
                    <ChartTooltipContent
                      labelFormatter={(l) => fmtDate(String(l))}
                      formatter={(v) => formatMoney(Number(v))}
                    />
                  }
                />
                <ChartLegend content={<ChartLegendContent />} />
                <Line
                  dataKey="ghs"
                  stroke="var(--color-ghs)"
                  strokeWidth={2}
                  dot={false}
                />
                <Line
                  dataKey="ngn"
                  stroke="var(--color-ngn)"
                  strokeWidth={2}
                  dot={false}
                />
              </LineChart>
            </ChartContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base font-semibold">
              Orders by status
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ChartContainer
              config={Object.fromEntries(
                statusChart.map((s) => [
                  s.status,
                  { label: s.label, color: s.fill },
                ]),
              )}
              className="h-56"
            >
              <PieChart>
                <ChartTooltip
                  content={
                    <ChartTooltipContent
                      hideLabel
                      formatter={(v) => formatNumber(Number(v))}
                    />
                  }
                />
                <Pie
                  data={statusChart}
                  dataKey="count"
                  nameKey="label"
                  innerRadius={40}
                  outerRadius={72}
                  paddingAngle={3}
                >
                  {statusChart.map((s) => (
                    <Cell key={s.status} fill={s.fill} />
                  ))}
                </Pie>
              </PieChart>
            </ChartContainer>
            <div className="mt-3 flex flex-wrap gap-x-4 gap-y-2">
              {statusChart.map((s) => (
                <div key={s.status} className="flex items-center gap-1.5 text-xs">
                  <span
                    className="h-2 w-2 rounded-sm"
                    style={{ background: s.fill }}
                  />
                  <span className="text-zinc-600">{s.label}</span>
                  <span className="font-medium text-zinc-900">
                    {formatNumber(s.count)}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base font-semibold">
              Top products this month
            </CardTitle>
          </CardHeader>
          <CardContent>
            {topProducts.length === 0 ? (
              <EmptyHint text="No paid orders yet this month." />
            ) : (
              <ChartContainer
                config={{ revenue: { label: "Revenue", color: "#3b82f6" } }}
                className="h-64"
              >
                <BarChart
                  data={topProducts}
                  layout="vertical"
                  margin={{ left: 16 }}
                >
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                  <XAxis type="number" hide />
                  <YAxis
                    type="category"
                    dataKey="name"
                    width={140}
                    tickLine={false}
                    axisLine={false}
                    tick={{ fontSize: 12 }}
                  />
                  <ChartTooltip
                    content={
                      <ChartTooltipContent
                        formatter={(v) => formatMoney(Number(v))}
                      />
                    }
                  />
                  <Bar dataKey="revenue" radius={[0, 4, 4, 0]}>
                    {topProducts.map((product, index) => (
                      <Cell
                        key={product.productId}
                        fill={chartColor(index)}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ChartContainer>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base font-semibold">
              Sales by country
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ChartContainer
              config={{
                revenue: { label: "Revenue", color: "#10b981" },
                orders: { label: "Orders", color: "#3b82f6" },
              }}
              className="h-64"
            >
              <BarChart data={salesByCountry}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="country" tickLine={false} axisLine={false} />
                <YAxis hide />
                <ChartTooltip
                  content={
                    <ChartTooltipContent
                      formatter={(v, name) =>
                        name === "Orders"
                          ? formatNumber(Number(v))
                          : formatMoney(Number(v))
                      }
                    />
                  }
                />
                <ChartLegend content={<ChartLegendContent />} />
                <Bar
                  dataKey="revenue"
                  fill="var(--color-revenue)"
                  radius={[4, 4, 0, 0]}
                />
                <Bar
                  dataKey="orders"
                  fill="var(--color-orders)"
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            </ChartContainer>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        <Card className="xl:col-span-2">
          <CardHeader className="flex items-center justify-between flex-row">
            <CardTitle className="text-zinc-900 text-base font-semibold">
              Recent orders
            </CardTitle>
            <Link
              href="/admin/orders"
              className="text-xs font-medium text-zinc-600 hover:text-zinc-900"
            >
              View all →
            </Link>
          </CardHeader>
          <CardContent className="px-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Order</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Total</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Date</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {recentOrders.map((o) => (
                  <TableRow key={o.id}>
                    <TableCell>
                      <Link
                        href={`/admin/orders/${o.id}`}
                        className="font-medium text-zinc-900 hover:underline"
                      >
                        {o.id}
                      </Link>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">{o.customerName}</div>
                      <div className="text-xs text-zinc-500">
                        {o.customerEmail}
                      </div>
                    </TableCell>
                    <TableCell className="text-sm">
                      {formatMoney(o.total)}
                    </TableCell>
                    <TableCell>
                      <OrderStatusBadge status={o.status} />
                    </TableCell>
                    <TableCell className="text-xs text-zinc-500">
                      {relative(o.createdAt)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex items-center justify-between flex-row">
            <CardTitle className="text-zinc-900 text-base font-semibold">
              Low stock alerts
            </CardTitle>
            <Link
              href="/admin/products"
              className="text-xs font-medium text-zinc-600 hover:text-zinc-900"
            >
              Manage →
            </Link>
          </CardHeader>
          <CardContent className="px-0">
            {lowStockRows.length === 0 ? (
              <div className="px-6 pb-6">
                <EmptyHint text="All variants are above the low stock threshold." />
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Product</TableHead>
                    <TableHead>Variant</TableHead>
                    <TableHead className="text-right">Stock</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {lowStockRows.slice(0, 8).map((r, i) => (
                    <TableRow key={i}>
                      <TableCell>
                        <Link
                          href={`/admin/products/${r.productId}`}
                          className="flex items-center gap-2 hover:underline"
                        >
                          <div className="relative h-8 w-8 rounded overflow-hidden bg-zinc-100">
                            {r.image && (
                              <Image
                                src={r.image}
                                alt=""
                                fill
                                className="object-cover"
                                sizes="32px"
                              />
                            )}
                          </div>
                          <span className="text-sm font-medium text-zinc-900 line-clamp-1">
                            {r.productName}
                          </span>
                        </Link>
                      </TableCell>
                      <TableCell className="text-xs text-zinc-600">
                        {r.color} · {r.size}
                      </TableCell>
                      <TableCell className="text-right">
                        <Badge variant="red">{r.stock} left</Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function MetricCard({
  label,
  value,
  changePct,
  hint,
}: {
  label: string;
  value: React.ReactNode;
  changePct?: number;
  hint?: string;
}) {
  const up = (changePct ?? 0) >= 0;
  return (
    <Card>
      <CardContent className="p-5">
        <div className="text-[10px] tracking-[0.2em] uppercase text-zinc-500">
          {label}
        </div>
        <div className="mt-2 text-xl font-semibold text-zinc-900">{value}</div>
        <div className="mt-2 flex items-center gap-2 text-xs">
          {changePct !== undefined && (
            <span
              className={`flex items-center gap-0.5 font-medium ${
                up ? "text-emerald-600" : "text-rose-600"
              }`}
            >
              {up ? (
                <ArrowUpRight className="h-3 w-3" />
              ) : (
                <ArrowDownRight className="h-3 w-3" />
              )}
              {Math.abs(changePct).toFixed(1)}%
            </span>
          )}
          <span className="text-zinc-400">
            {hint ?? (changePct !== undefined ? "vs. last period" : "")}
          </span>
        </div>
      </CardContent>
    </Card>
  );
}

function EmptyHint({ text }: { text: string }) {
  return (
    <div className="flex items-center gap-2 text-sm text-zinc-500">
      <TrendingUp className="h-4 w-4" />
      {text}
    </div>
  );
}
