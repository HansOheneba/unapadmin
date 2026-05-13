"use client";

import { useState } from "react";
import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from "recharts";
import { useDashboardStats } from "@/lib/hooks";
import { CsvExportButton } from "@/components/shared/csv-export-button";
import Image from "next/image";
import { formatCurrency } from "@/lib/utils";

const COLORS = ["#18181b", "#52525b", "#a1a1aa", "#d4d4d8", "#e4e4e7"];

export default function AnalyticsPage() {
  const [from, setFrom] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() - 30);
    return d.toISOString().slice(0, 10);
  });
  const [to, setTo] = useState(() => new Date().toISOString().slice(0, 10));
  const { data: stats, isLoading } = useDashboardStats();

  if (isLoading) {
    return (
      <div className="grid grid-cols-2 gap-6">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-64 bg-white border border-zinc-100 rounded-lg animate-pulse" />
        ))}
      </div>
    );
  }

  if (!stats) return null;

  const collectionRevenue = [
    { name: "Boxers", revenue: 12500 },
    { name: "Hoodies", revenue: 9800 },
    { name: "Sunglasses", revenue: 7300 },
    { name: "Headwear", revenue: 6100 },
    { name: "Tracks", revenue: 4400 },
  ];

  const countryRevenue = [
    { name: "Ghana", revenue: 18000 },
    { name: "Nigeria", revenue: 9500 },
    { name: "USA", revenue: 7200 },
    { name: "UK", revenue: 5100 },
    { name: "Canada", revenue: 3400 },
  ];

  const customerPie = [
    { name: "New", value: 62 },
    { name: "Returning", value: 38 },
  ];

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-zinc-900">Analytics</h1>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 text-sm">
            <label className="text-zinc-500">From</label>
            <input
              type="date"
              value={from}
              onChange={(e) => setFrom(e.target.value)}
              className="border border-zinc-200 rounded px-2 py-1.5 text-sm focus:outline-none focus:border-zinc-400"
            />
            <label className="text-zinc-500">To</label>
            <input
              type="date"
              value={to}
              onChange={(e) => setTo(e.target.value)}
              className="border border-zinc-200 rounded px-2 py-1.5 text-sm focus:outline-none focus:border-zinc-400"
            />
          </div>
          <CsvExportButton url="/analytics/export/csv" params={{ from, to }} filename="analytics.csv" />
        </div>
      </div>

      {/* Revenue over time */}
      <div className="bg-white border border-zinc-100 rounded-lg p-6">
        <h2 className="font-semibold text-zinc-900 mb-4">Revenue Over Time</h2>
        <ResponsiveContainer width="100%" height={260}>
          <LineChart data={stats.revenueChart}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f4f4f5" />
            <XAxis dataKey="date" tick={{ fontSize: 11, fill: "#a1a1aa" }} />
            <YAxis tick={{ fontSize: 11, fill: "#a1a1aa" }} />
            <Tooltip formatter={(v: unknown) => formatCurrency(v as number)} />
            <Line type="monotone" dataKey="revenue" stroke="#18181b" strokeWidth={2} dot={false} />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Orders by status */}
        <div className="bg-white border border-zinc-100 rounded-lg p-6">
          <h2 className="font-semibold text-zinc-900 mb-4">Orders by Status</h2>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={stats.ordersByStatus}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f4f4f5" />
              <XAxis dataKey="status" tick={{ fontSize: 10, fill: "#a1a1aa" }} />
              <YAxis tick={{ fontSize: 11, fill: "#a1a1aa" }} />
              <Tooltip />
              <Bar dataKey="count" fill="#18181b" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* New vs returning customers */}
        <div className="bg-white border border-zinc-100 rounded-lg p-6">
          <h2 className="font-semibold text-zinc-900 mb-4">New vs Returning Customers</h2>
          <ResponsiveContainer width="100%" height={240}>
            <PieChart>
              <Pie data={customerPie} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={90} label={({ name, value }) => `${name} ${value}%`}>
                {customerPie.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
              </Pie>
              <Legend />
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Sales by collection */}
        <div className="bg-white border border-zinc-100 rounded-lg p-6">
          <h2 className="font-semibold text-zinc-900 mb-4">Sales by Collection</h2>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={collectionRevenue} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="#f4f4f5" />
              <XAxis type="number" tick={{ fontSize: 11, fill: "#a1a1aa" }} />
              <YAxis dataKey="name" type="category" tick={{ fontSize: 11, fill: "#a1a1aa" }} width={70} />
              <Tooltip formatter={(v: unknown) => formatCurrency(v as number)} />
              <Bar dataKey="revenue" fill="#18181b" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Sales by country */}
        <div className="bg-white border border-zinc-100 rounded-lg p-6">
          <h2 className="font-semibold text-zinc-900 mb-4">Sales by Country</h2>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={countryRevenue} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="#f4f4f5" />
              <XAxis type="number" tick={{ fontSize: 11, fill: "#a1a1aa" }} />
              <YAxis dataKey="name" type="category" tick={{ fontSize: 11, fill: "#a1a1aa" }} width={70} />
              <Tooltip formatter={(v: unknown) => formatCurrency(v as number)} />
              <Bar dataKey="revenue" fill="#52525b" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Top products */}
      <div className="bg-white border border-zinc-100 rounded-lg p-6">
        <h2 className="font-semibold text-zinc-900 mb-4">Top Products</h2>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-zinc-100">
              <th className="text-left py-2 text-xs text-zinc-500 font-medium">Product</th>
              <th className="text-right py-2 text-xs text-zinc-500 font-medium">Units Sold</th>
              <th className="text-right py-2 text-xs text-zinc-500 font-medium">Revenue</th>
            </tr>
          </thead>
          <tbody>
            {stats.topProducts.map((p) => (
              <tr key={p.productId} className="border-b border-zinc-50">
                <td className="py-3 flex items-center gap-3">
                  <div className="relative h-9 w-9 rounded overflow-hidden shrink-0">
                    <Image src={p.image} alt={p.name} fill className="object-cover" />
                  </div>
                  <span className="text-zinc-800">{p.name}</span>
                </td>
                <td className="py-3 text-right text-zinc-700">{p.unitsSold}</td>
                <td className="py-3 text-right font-medium text-zinc-900">{formatCurrency(p.revenue)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
