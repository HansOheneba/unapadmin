"use client";

import * as React from "react";
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
import { useAdminStore } from "@/lib/store";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { downloadCsv, fmtDate, formatMoney } from "@/lib/format";
import { Download } from "lucide-react";

const STATUS_COLORS: Record<string, string> = {
  pending: "#f59e0b",
  processing: "#3b82f6",
  shipped: "#6366f1",
  in_transit: "#8b5cf6",
  out_for_delivery: "#f97316",
  delivered: "#10b981",
  cancelled: "#71717a",
  refunded: "#f43f5e",
  exception: "#dc2626",
};

export default function AnalyticsPage() {
  const orders = useAdminStore((s) => s.orders);
  const customers = useAdminStore((s) => s.customers);
  const collections = useAdminStore((s) => s.collections);
  const products = useAdminStore((s) => s.products);

  const [from, setFrom] = React.useState<string>(() => {
    const d = new Date();
    d.setDate(d.getDate() - 30);
    return d.toISOString().slice(0, 10);
  });
  const [to, setTo] = React.useState<string>(() =>
    new Date().toISOString().slice(0, 10),
  );

  const inRange = React.useMemo(() => {
    const f = new Date(from);
    const t = new Date(to);
    t.setHours(23, 59, 59, 999);
    return orders.filter((o) => {
      const d = new Date(o.createdAt);
      return d >= f && d <= t;
    });
  }, [orders, from, to]);

  const paid = inRange.filter((o) => o.paymentStatus === "paid");

  // Revenue over time (daily)
  const dailyRevenue = React.useMemo(() => {
    const buckets: Record<string, { date: string; ghs: number; ngn: number }> =
      {};
    const start = new Date(from);
    const end = new Date(to);
    for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
      const k = d.toISOString().slice(0, 10);
      buckets[k] = { date: k, ghs: 0, ngn: 0 };
    }
    paid.forEach((o) => {
      const k = new Date(o.createdAt).toISOString().slice(0, 10);
      if (!buckets[k]) buckets[k] = { date: k, ghs: 0, ngn: 0 };
      if (o.currency === "GHS") buckets[k].ghs += o.total;
      else buckets[k].ngn += o.total;
    });
    return Object.values(buckets);
  }, [paid, from, to]);

  // Orders by status
  const ordersByStatus = React.useMemo(() => {
    const m: Record<string, number> = {};
    inRange.forEach((o) => (m[o.status] = (m[o.status] ?? 0) + 1));
    return Object.entries(m).map(([status, count]) => ({ status, count }));
  }, [inRange]);

  // Top products by revenue (GHS only for simplicity)
  const topProducts = React.useMemo(() => {
    const m = new Map<
      string,
      { name: string; units: number; revenue: number }
    >();
    paid
      .filter((o) => o.currency === "GHS")
      .forEach((o) => {
        o.items.forEach((it) => {
          const cur = m.get(it.productId) ?? {
            name: it.productName,
            units: 0,
            revenue: 0,
          };
          cur.units += it.quantity;
          cur.revenue += it.totalPrice;
          m.set(it.productId, cur);
        });
      });
    return [...m.values()].sort((a, b) => b.revenue - a.revenue).slice(0, 8);
  }, [paid]);

  // Sales by collection
  const salesByCollection = React.useMemo(() => {
    const m: Record<string, number> = {};
    paid
      .filter((o) => o.currency === "GHS")
      .forEach((o) => {
        o.items.forEach((it) => {
          m[it.collectionId] = (m[it.collectionId] ?? 0) + it.totalPrice;
        });
      });
    return collections.map((c) => ({
      collection: c.subtitle,
      revenue: m[c.id] ?? 0,
    }));
  }, [paid, collections]);

  // Sales by country
  const salesByCountry = React.useMemo(
    () => [
      {
        country: "Ghana",
        revenue: paid
          .filter((o) => o.currency === "GHS")
          .reduce((s, o) => s + o.total, 0),
        orders: paid.filter((o) => o.currency === "GHS").length,
      },
      {
        country: "Nigeria",
        revenue: paid
          .filter((o) => o.currency === "NGN")
          .reduce((s, o) => s + o.total, 0),
        orders: paid.filter((o) => o.currency === "NGN").length,
      },
    ],
    [paid],
  );

  // Payment split
  const paymentSplit = React.useMemo(() => {
    const m: Record<string, number> = {};
    inRange.forEach(
      (o) => (m[o.paymentMethod] = (m[o.paymentMethod] ?? 0) + 1),
    );
    return Object.entries(m).map(([method, count]) => ({ method, count }));
  }, [inRange]);

  // New vs returning customers (based on totalOrders snapshot)
  const newVsReturning = React.useMemo(() => {
    const f = new Date(from);
    const t = new Date(to);
    const newCount = customers.filter((c) => {
      const d = new Date(c.joinedDate);
      return d >= f && d <= t;
    }).length;
    return [
      { label: "New", value: newCount },
      {
        label: "Returning",
        value: customers.filter((c) => c.totalOrders > 1).length,
      },
    ];
  }, [customers, from, to]);

  // AOV trend
  const aovTrend = React.useMemo(() => {
    const m: Record<string, { count: number; revenue: number }> = {};
    paid
      .filter((o) => o.currency === "GHS")
      .forEach((o) => {
        const k = new Date(o.createdAt).toISOString().slice(0, 10);
        m[k] = m[k] ?? { count: 0, revenue: 0 };
        m[k].count += 1;
        m[k].revenue += o.total;
      });
    return Object.entries(m)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, v]) => ({
        date,
        aov: v.count === 0 ? 0 : v.revenue / v.count,
      }));
  }, [paid]);

  const exportReport = () => {
    downloadCsv(
      `analytics-${from}-to-${to}.csv`,
      inRange.map((o) => ({
        order_id: o.id,
        date: o.createdAt,
        customer: o.customerName,
        country: o.currency === "GHS" ? "Ghana" : "Nigeria",
        total: o.total,
        currency: o.currency,
        payment_method: o.paymentMethod,
        payment_status: o.paymentStatus,
        status: o.status,
        items: o.items.reduce((s, i) => s + i.quantity, 0),
      })),
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-zinc-900">Analytics</h1>
          <p className="text-sm text-zinc-500 mt-1">
            Data for {fmtDate(from)} → {fmtDate(to)} · {inRange.length} orders
          </p>
        </div>
        <div className="flex items-end gap-2">
          <div>
            <Label className="text-xs">From</Label>
            <Input
              type="date"
              value={from}
              onChange={(e) => setFrom(e.target.value)}
              className="text-xs"
            />
          </div>
          <div>
            <Label className="text-xs">To</Label>
            <Input
              type="date"
              value={to}
              onChange={(e) => setTo(e.target.value)}
              className="text-xs"
            />
          </div>
          <Button variant="outline" onClick={exportReport}>
            <Download className="h-4 w-4" />
            Export
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base font-semibold">
              Revenue over time
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ChartContainer
              config={{
                ghs: { label: "Ghana", color: "#0a0a0a" },
                ngn: { label: "Nigeria", color: "#a1a1aa" },
              }}
              className="h-72"
            >
              <LineChart data={dailyRevenue} margin={{ left: 8, right: 16 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis
                  dataKey="date"
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(v) => fmtDate(v).replace(", 2026", "")}
                  minTickGap={32}
                />
                <YAxis hide />
                <ChartTooltip
                  content={
                    <ChartTooltipContent
                      labelFormatter={(l) => fmtDate(String(l))}
                      formatter={(v, name) =>
                        name === "Ghana"
                          ? formatMoney(Number(v), "GHS")
                          : formatMoney(Number(v), "NGN")
                      }
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
                  strokeDasharray="4 4"
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
                ordersByStatus.map((s) => [
                  s.status,
                  {
                    label: s.status
                      .split("_")
                      .map((w) => w[0].toUpperCase() + w.slice(1))
                      .join(" "),
                    color: STATUS_COLORS[s.status],
                  },
                ]),
              )}
              className="h-72"
            >
              <BarChart data={ordersByStatus}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis
                  dataKey="status"
                  tickLine={false}
                  axisLine={false}
                  hide
                />
                <YAxis hide />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                  {ordersByStatus.map((s) => (
                    <Cell key={s.status} fill={STATUS_COLORS[s.status]} />
                  ))}
                </Bar>
              </BarChart>
            </ChartContainer>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-base font-semibold">
              Top products
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ChartContainer
              config={{ revenue: { label: "Revenue", color: "#0a0a0a" } }}
              className="h-72"
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
                      formatter={(v) => formatMoney(Number(v), "GHS")}
                    />
                  }
                />
                <Bar
                  dataKey="revenue"
                  fill="var(--color-revenue)"
                  radius={[0, 4, 4, 0]}
                />
              </BarChart>
            </ChartContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base font-semibold">
              Sales by collection
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ChartContainer
              config={{ revenue: { label: "Revenue", color: "#0a0a0a" } }}
              className="h-72"
            >
              <BarChart data={salesByCollection}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis
                  dataKey="collection"
                  tickLine={false}
                  axisLine={false}
                  tick={{ fontSize: 11 }}
                />
                <YAxis hide />
                <ChartTooltip
                  content={
                    <ChartTooltipContent
                      formatter={(v) => formatMoney(Number(v), "GHS")}
                    />
                  }
                />
                <Bar
                  dataKey="revenue"
                  fill="var(--color-revenue)"
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            </ChartContainer>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-base font-semibold">
              Sales by country
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ChartContainer
              config={{
                revenue: { label: "Revenue", color: "#0a0a0a" },
                orders: { label: "Orders", color: "#a1a1aa" },
              }}
              className="h-64"
            >
              <BarChart data={salesByCountry}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="country" tickLine={false} axisLine={false} />
                <YAxis hide />
                <ChartTooltip content={<ChartTooltipContent />} />
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

        <Card>
          <CardHeader>
            <CardTitle className="text-base font-semibold">
              Payment methods
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ChartContainer
              config={{
                momo: { label: "Mobile money", color: "#0a0a0a" },
                card: { label: "Card", color: "#3b82f6" },
                cash: { label: "Cash", color: "#10b981" },
              }}
              className="h-64"
            >
              <PieChart>
                <ChartTooltip content={<ChartTooltipContent hideLabel />} />
                <Pie
                  data={paymentSplit}
                  dataKey="count"
                  nameKey="method"
                  innerRadius={40}
                  outerRadius={80}
                  paddingAngle={2}
                >
                  {paymentSplit.map((p) => (
                    <Cell
                      key={p.method}
                      fill={
                        p.method === "momo"
                          ? "#0a0a0a"
                          : p.method === "card"
                            ? "#3b82f6"
                            : "#10b981"
                      }
                    />
                  ))}
                </Pie>
                <ChartLegend content={<ChartLegendContent />} />
              </PieChart>
            </ChartContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base font-semibold">
              Customer acquisition
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ChartContainer
              config={{
                value: { label: "Customers", color: "#0a0a0a" },
              }}
              className="h-64"
            >
              <BarChart data={newVsReturning}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="label" tickLine={false} axisLine={false} />
                <YAxis hide />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                  {newVsReturning.map((d, i) => (
                    <Cell key={i} fill={i === 0 ? "#0a0a0a" : "#a1a1aa"} />
                  ))}
                </Bar>
              </BarChart>
            </ChartContainer>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base font-semibold">
            Average order value (GHS)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ChartContainer
            config={{ aov: { label: "AOV", color: "#0a0a0a" } }}
            className="h-60"
          >
            <LineChart data={aovTrend}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis
                dataKey="date"
                tickLine={false}
                axisLine={false}
                tickFormatter={(v) => fmtDate(v).replace(", 2026", "")}
                minTickGap={32}
              />
              <YAxis hide />
              <ChartTooltip
                content={
                  <ChartTooltipContent
                    labelFormatter={(l) => fmtDate(String(l))}
                    formatter={(v) => formatMoney(Number(v), "GHS")}
                  />
                }
              />
              <Line
                dataKey="aov"
                stroke="var(--color-aov)"
                strokeWidth={2}
                dot={false}
              />
            </LineChart>
          </ChartContainer>
        </CardContent>
      </Card>
    </div>
  );
}
