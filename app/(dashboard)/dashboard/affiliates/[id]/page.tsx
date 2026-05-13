"use client";

import { use, useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { useAffiliate, useCreatePayout } from "@/lib/hooks";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatCurrency, formatDate } from "@/lib/utils";

export default function AffiliateDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { data, isLoading } = useAffiliate(id);
  const createPayout = useCreatePayout();
  const [showPayoutForm, setShowPayoutForm] = useState(false);
  const [payout, setPayout] = useState({ amount: 0, method: "bank", reference: "" });

  const handlePayout = (e: React.FormEvent) => {
    e.preventDefault();
    createPayout.mutate(
      {
        affiliateId: id,
        body: {
          amount: payout.amount,
          method: payout.method,
          reference: payout.reference || null,
        },
      },
      {
        onSuccess: () => {
          toast.success("Payout recorded");
          setShowPayoutForm(false);
          setPayout({ amount: 0, method: "bank", reference: "" });
        },
        onError: () => toast.error("Failed to record payout"),
      },
    );
  };

  if (isLoading) return <div className="h-48 bg-white border border-zinc-100 rounded-lg animate-pulse" />;
  if (!data) return <div className="text-zinc-500">Affiliate not found.</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-zinc-900">{data.name}</h1>
        <Link href="/dashboard/affiliates"><Button variant="outline">Back</Button></Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Profile */}
        <div className="bg-white border border-zinc-100 rounded-lg p-6 space-y-3">
          <h2 className="font-semibold text-zinc-900">Profile</h2>
          <div className="space-y-2 text-sm">
            <div><p className="text-zinc-500">Email</p><p className="text-zinc-800">{data.email}</p></div>
            <div><p className="text-zinc-500">Promo Code</p><p className="font-mono text-zinc-900">{data.code}</p></div>
            <div><p className="text-zinc-500">Commission</p><p className="text-zinc-800">{(data.commissionRate * 100).toFixed(0)}%</p></div>
            <div><p className="text-zinc-500">Status</p><Badge variant={data.active ? "green" : "zinc"}>{data.active ? "Active" : "Inactive"}</Badge></div>
          </div>
        </div>

        {/* Stats */}
        <div className="lg:col-span-2 grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: "Referrals", value: data.totalReferrals },
            { label: "Revenue", value: formatCurrency(data.totalRevenue) },
            { label: "Owed", value: formatCurrency(data.totalOwed) },
            { label: "Paid", value: formatCurrency(data.totalPaid) },
          ].map((s) => (
            <div key={s.label} className="bg-white border border-zinc-100 rounded-lg p-4">
              <p className="text-xs text-zinc-500">{s.label}</p>
              <p className="text-xl font-semibold text-zinc-900 mt-1">{s.value}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Payout history */}
      <div className="bg-white border border-zinc-100 rounded-lg overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-zinc-100">
          <h2 className="font-semibold text-zinc-900">Payout History</h2>
          <Button size="sm" onClick={() => setShowPayoutForm(!showPayoutForm)}>
            Record Payout
          </Button>
        </div>

        {showPayoutForm && (
          <form onSubmit={handlePayout} className="p-5 border-b border-zinc-100 bg-zinc-50 grid grid-cols-3 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="amount">Amount</Label>
              <Input id="amount" type="number" value={payout.amount} onChange={(e) => setPayout({ ...payout, amount: Number(e.target.value) })} required />
            </div>
            <div className="space-y-1.5">
              <Label>Method</Label>
              <Select value={payout.method} onValueChange={(v) => setPayout({ ...payout, method: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="bank">Bank Transfer</SelectItem>
                  <SelectItem value="momo">Mobile Money</SelectItem>
                  <SelectItem value="paypal">PayPal</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="ref">Reference</Label>
              <Input id="ref" value={payout.reference} onChange={(e) => setPayout({ ...payout, reference: e.target.value })} placeholder="Optional" />
            </div>
            <div className="col-span-3 flex gap-3">
              <Button type="submit" disabled={createPayout.isPending}>
                {createPayout.isPending ? "Saving..." : "Save Payout"}
              </Button>
              <Button type="button" variant="outline" onClick={() => setShowPayoutForm(false)}>Cancel</Button>
            </div>
          </form>
        )}

        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Date</TableHead>
              <TableHead>Amount</TableHead>
              <TableHead>Method</TableHead>
              <TableHead>Reference</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.payouts.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="text-center text-zinc-400 py-8">No payouts yet.</TableCell>
              </TableRow>
            ) : (
              data.payouts.map((p) => (
                <TableRow key={p.id}>
                  <TableCell className="text-zinc-600">{formatDate(p.paidAt)}</TableCell>
                  <TableCell className="font-medium">{formatCurrency(p.amount)}</TableCell>
                  <TableCell className="text-zinc-600 capitalize">{p.method}</TableCell>
                  <TableCell className="text-zinc-500">{p.reference ?? "N/A"}</TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
