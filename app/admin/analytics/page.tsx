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
import { useCollections } from "@/lib/hooks/useCollections";
import { exportAnalyticsCsv } from "@/lib/api/analytics";
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
import {
  fmtDate,
  formatMoney,
  formatNumber,
  paymentMethodLabel,
  statusLabel,
} from "@/lib/format";
import { AnalyticsSkeleton } from "@/components/shared/page-skeletons";
import { Download } from "lucide-react";
import { toast } from "sonner";
import type { Currency, PaymentMethod } from "@/types";

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

const PAYMENT_COLORS: Record<PaymentMethod, string> = {
  momo: "#f59e0b",
  card: "#3b82f6",
  cash: "#10b981",
  paystack: "#06b6d4",
  pay_on_delivery: "#8b5cf6",
};

function chartColor(index: number) {
  return CHART_PALETTE[index % CHART_PALETTE.length];
}

function paymentColor(method: string, index: number) {
  if (method in PAYMENT_COLORS) {
    return PAYMENT_COLORS[method as PaymentMethod];
  }
  return chartColor(index);
}

function humanizeId(value: string) {
  return statusLabel(value.replace(/-/g, "_"));
}

function shortDate(value: string) {
  return fmtDate(value).replace(/,\s*\d{4}$/, "");
}

function MetricCard({
  label,
  value,
  hint,
}: {
  label: string;
  value: React.ReactNode;
  hint?: string;
}) {
  return (
    <Card>
      <CardContent className="p-5">
        <div className="text-[10px] tracking-[0.2em] uppercase text-zinc-500">
          {label}
        </div>
        <div className="mt-2 text-xl font-semibold text-zinc-900">{value}</div>
        {hint ? <p className="mt-2 text-xs text-zinc-400">{hint}</p> : null}
      </CardContent>
    </Card>
  );
}

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
  const { data: collections = [] } = useCollections();

  const collectionNameById = React.useMemo(() => {
    const map = new Map<string, string>();
    for (const collection of collections) {
      map.set(collection.id, collection.subtitle || collection.title);
    }
    return map;
  }, [collections]);

  const exportReport = async () => {
    try {
      await exportAnalyticsCsv(from, to);
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

  const salesByCollectionChart = salesByCollection
    .map((row) => {
      const resolved =
        collectionNameById.get(row.collectionId) ??
        (row.collection && row.collection !== row.collectionId
          ? row.collection
          : humanizeId(row.collectionId || row.collection));
      return {
        collection: resolved,
        revenue:
          topProductsCurrency === "GHS" ? row.revenueGhs : row.revenueNgn,
      };
    })
    .sort((a, b) => b.revenue - a.revenue);

  const paymentChart = paymentSplit
    .map((row, index) => ({
      method: row.method,
      label: paymentMethodLabel(row.method),
      count: row.count,
      fill: paymentColor(row.method, index),
    }))
    .sort((a, b) => b.count - a.count);

  const paymentTotal = paymentChart.reduce((sum, row) => sum + row.count, 0);

  const statusChart = ordersByStatus
    .map((row) => ({
      status: row.status,
      label: statusLabel(row.status),
      count: row.count,
      fill: STATUS_COLORS[row.status] ?? "#71717a",
    }))
    .sort((a, b) => b.count - a.count);

  const paidRate =
    summary.totalOrders > 0
      ? Math.round((summary.totalPaidOrders / summary.totalOrders) * 100)
      : 0;

  const aovSamples = aovTrend.filter((d) => d.aovGhs > 0);
  const aovGhs = aovSamples.length
    ? Math.round(
        aovSamples.reduce((sum, d) => sum + d.aovGhs, 0) / aovSamples.length,
      )
    : 0;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-zinc-900">Analytics</h1>
          <p className="text-sm text-zinc-500 mt-1">
            {fmtDate(from)} → {fmtDate(to)} · {formatNumber(summary.totalOrders)}{" "}
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

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        <MetricCard
          label="Revenue (GHS)"
          value={formatMoney(summary.totalRevenueGhs)}
          hint="Paid orders"
        />
        <MetricCard
          label="Revenue (NGN)"
          value={formatMoney(summary.totalRevenueNgn)}
          hint="Paid orders"
        />
        <MetricCard
          label="Orders"
          value={formatNumber(summary.totalOrders)}
          hint={`${formatNumber(summary.totalPaidOrders)} paid`}
        />
        <MetricCard
          label="Paid rate"
          value={`${paidRate}%`}
          hint="Paid / all orders"
        />
        <MetricCard
          label="New customers"
          value={formatNumber(summary.newCustomers)}
          hint="Joined in range"
        />
        <MetricCard
          label="Avg order value"
          value={formatMoney(aovGhs)}
          hint="GHS paid orders"
        />
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
                ghs: { label: "Ghana", color: "#10b981" },
                ngn: { label: "Nigeria", color: "#3b82f6" },
              }}
              className="h-72"
            >
              <LineChart data={dailyRevenue} margin={{ left: 8, right: 16 }}>
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
              className="h-72"
            >
              <BarChart data={statusChart}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="label" tickLine={false} axisLine={false} hide />
                <YAxis hide />
                <ChartTooltip
                  content={
                    <ChartTooltipContent
                      formatter={(v) => formatNumber(Number(v))}
                    />
                  }
                />
                <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                  {statusChart.map((s) => (
                    <Cell key={s.status} fill={s.fill} />
                  ))}
                </Bar>
              </BarChart>
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
                config={{ revenue: { label: "Revenue", color: "#3b82f6" } }}
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
                        formatter={(v) => formatMoney(Number(v))}
                      />
                    }
                  />
                  <Bar dataKey="revenue" radius={[0, 4, 4, 0]}>
                    {activeTopProducts.map((product, index) => (
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
          <CardHeader className="flex flex-row items-center justify-between gap-2">
            <CardTitle className="text-base font-semibold">
              Sales by collection
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
            {salesByCollectionChart.length === 0 ? (
              <p className="text-sm text-zinc-500 text-center py-8">
                No collection sales in this period.
              </p>
            ) : (
              <ChartContainer
                config={{ revenue: { label: "Revenue", color: "#8b5cf6" } }}
                className="h-72"
              >
                <BarChart
                  data={salesByCollectionChart}
                  layout="vertical"
                  margin={{ left: 8 }}
                >
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                  <XAxis type="number" hide />
                  <YAxis
                    type="category"
                    dataKey="collection"
                    width={110}
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
                    {salesByCollectionChart.map((row, index) => (
                      <Cell
                        key={row.collection}
                        fill={chartColor(index)}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ChartContainer>
            )}
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

        <Card>
          <CardHeader>
            <CardTitle className="text-base font-semibold">
              Payment methods
            </CardTitle>
          </CardHeader>
          <CardContent>
            {paymentChart.length === 0 ? (
              <p className="text-sm text-zinc-500 text-center py-8">
                No payment data in this period.
              </p>
            ) : (
              <>
                <ChartContainer
                  config={Object.fromEntries(
                    paymentChart.map((p) => [
                      p.method,
                      { label: p.label, color: p.fill },
                    ]),
                  )}
                  className="h-48"
                >
                  <PieChart>
                    <ChartTooltip
                      content={
                        <ChartTooltipContent
                          hideLabel
                          formatter={(v) => {
                            const count = Number(v);
                            const pct =
                              paymentTotal > 0
                                ? Math.round((count / paymentTotal) * 100)
                                : 0;
                            return `${formatNumber(count)} (${pct}%)`;
                          }}
                        />
                      }
                    />
                    <Pie
                      data={paymentChart}
                      dataKey="count"
                      nameKey="label"
                      innerRadius={40}
                      outerRadius={72}
                      paddingAngle={3}
                    >
                      {paymentChart.map((p) => (
                        <Cell key={p.method} fill={p.fill} />
                      ))}
                    </Pie>
                  </PieChart>
                </ChartContainer>
                <ul className="mt-2 space-y-2">
                  {paymentChart.map((p) => {
                    const pct =
                      paymentTotal > 0
                        ? Math.round((p.count / paymentTotal) * 100)
                        : 0;
                    return (
                      <li
                        key={p.method}
                        className="flex items-center justify-between gap-3 text-sm"
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <span
                            className="h-2.5 w-2.5 shrink-0 rounded-sm"
                            style={{ background: p.fill }}
                          />
                          <span className="truncate text-zinc-700">
                            {p.label}
                          </span>
                        </div>
                        <span className="shrink-0 tabular-nums text-zinc-900">
                          {formatNumber(p.count)} · {pct}%
                        </span>
                      </li>
                    );
                  })}
                </ul>
              </>
            )}
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
                value: { label: "Customers", color: "#3b82f6" },
              }}
              className="h-64"
            >
              <BarChart data={newVsReturning}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="label" tickLine={false} axisLine={false} />
                <YAxis hide />
                <ChartTooltip
                  content={
                    <ChartTooltipContent
                      formatter={(v) => formatNumber(Number(v))}
                    />
                  }
                />
                <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                  {newVsReturning.map((d, i) => (
                    <Cell
                      key={d.label}
                      fill={i === 0 ? "#3b82f6" : "#10b981"}
                    />
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
            config={{ aov: { label: "AOV", color: "#8b5cf6" } }}
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
