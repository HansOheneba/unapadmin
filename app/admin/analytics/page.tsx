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
import { useAnalytics } from "@/lib/hooks/useAnalytics";
import { getOrders } from "@/lib/api/orders";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { downloadCsv, fmtDate, formatMoney } from "@/lib/format";
import { AnalyticsSkeleton } from "@/components/shared/page-skeletons";
import { Download } from "lucide-react";
import { toast } from "sonner";
import type { Currency } from "@/types";

const STATUS_COLORS: Record<string, string> = {
  processing: "#3b82f6",
  ready_for_pickup: "#f59e0b",
  picked_up: "#6366f1",
  in_transit: "#8b5cf6",
  delivered: "#10b981",
  returned: "#dc2626",
  cancelled: "#71717a",
  refunded: "#f43f5e",
};

export default function AnalyticsPage() {
  const [from, setFrom] = React.useState<string>(() => {
    const d = new Date();
    d.setDate(d.getDate() - 30);
    return d.toISOString().slice(0, 10);
  });
  const [to, setTo] = React.useState<string>(() =>
    new Date().toISOString().slice(0, 10),
  );
  const [topProductsCurrency, setTopProductsCurrency] =
    React.useState<Currency>("GHS");

  const { data: report, isLoading } = useAnalytics(from, to);

  const exportReport = async () => {
    try {
      const { data: orders } = await getOrders({ from, to });
      downloadCsv(
        `analytics-${from}-to-${to}.csv`,
        orders.map((o) => ({
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
    } catch (e) {
      toast.error(
        e instanceof Error ? e.message : "Failed to export report.",
      );
    }
  };

  if (isLoading || !report) {
    return <AnalyticsSkeleton />;
  }

  const {
    dailyRevenue,
    ordersByStatus,
    topProducts,
    topProductsNgn,
    salesByCollection,
    salesByCountry,
    paymentSplit,
    newVsReturning,
    aovTrend,
    summary,
  } = report;

  const activeTopProducts =
    topProductsCurrency === "GHS" ? topProducts : topProductsNgn;

  const salesByCollectionChart = salesByCollection.map((c) => ({
    collection: c.collection,
    revenue:
      topProductsCurrency === "GHS" ? c.revenueGhs : c.revenueNgn,
  }));

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-zinc-900">Analytics</h1>
          <p className="text-sm text-zinc-500 mt-1">
            Data for {fmtDate(from)} → {fmtDate(to)} · {summary.totalOrders}{" "}
            orders
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
                          ? formatMoney(Number(v))
                          : formatMoney(Number(v))
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
          <CardHeader className="flex flex-row items-center justify-between gap-2">
            <CardTitle className="text-base font-semibold">
              Top products
            </CardTitle>
            <Tabs
              value={topProductsCurrency}
              onValueChange={(v) => setTopProductsCurrency(v as Currency)}
            >
              <TabsList className="h-8">
                <TabsTrigger value="GHS" className="text-xs px-3">
                  GHS
                </TabsTrigger>
                <TabsTrigger value="NGN" className="text-xs px-3">
                  NGN
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </CardHeader>
          <CardContent>
            {activeTopProducts.length === 0 ? (
              <p className="text-sm text-zinc-500 text-center py-8">
                No paid orders in this period for {topProductsCurrency}.
              </p>
            ) : (
              <ChartContainer
                config={{ revenue: { label: "Revenue", color: "#0a0a0a" } }}
                className="h-72"
              >
                <BarChart
                  data={activeTopProducts}
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
                        formatter={(v) =>
                          formatMoney(Number(v))
                        }
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
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base font-semibold">
              Sales by collection ({topProductsCurrency})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ChartContainer
              config={{ revenue: { label: "Revenue", color: "#0a0a0a" } }}
              className="h-72"
            >
              <BarChart data={salesByCollectionChart}>
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
                      formatter={(v) =>
                        formatMoney(Number(v))
                      }
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
        <CardHeader className="flex flex-row items-center justify-between gap-2">
          <CardTitle className="text-base font-semibold">
            Average order value
          </CardTitle>
          <Tabs
            value={topProductsCurrency}
            onValueChange={(v) => setTopProductsCurrency(v as Currency)}
          >
            <TabsList className="h-8">
              <TabsTrigger value="GHS" className="text-xs px-3">
                GHS
              </TabsTrigger>
              <TabsTrigger value="NGN" className="text-xs px-3">
                NGN
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </CardHeader>
        <CardContent>
          <ChartContainer
            config={{ aov: { label: "AOV", color: "#0a0a0a" } }}
            className="h-60"
          >
            <LineChart
              data={aovTrend.map((d) => ({
                date: d.date,
                aov: topProductsCurrency === "GHS" ? d.aovGhs : d.aovNgn,
              }))}
            >
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
                    formatter={(v) =>
                      formatMoney(Number(v))
                    }
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
