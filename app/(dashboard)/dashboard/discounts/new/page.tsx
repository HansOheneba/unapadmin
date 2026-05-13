"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { createDiscount } from "@/lib/api/discounts";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export default function NewDiscountPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    code: "",
    type: "PERCENTAGE" as "PERCENTAGE" | "FIXED",
    value: 0,
    minOrderValue: "",
    maxUses: "",
    expiresAt: "",
    active: true,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await createDiscount({
        code: form.code,
        type: form.type,
        value: form.value,
        minOrderValue: form.minOrderValue ? Number(form.minOrderValue) : null,
        maxUses: form.maxUses ? Number(form.maxUses) : null,
        expiresAt: form.expiresAt || null,
        active: form.active,
      });
      toast.success("Discount created");
      router.push("/dashboard/discounts");
    } catch {
      toast.error("Failed to create discount");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md space-y-6">
      <h1 className="text-2xl font-semibold text-zinc-900">New Discount</h1>
      <form onSubmit={handleSubmit} className="bg-white border border-zinc-100 rounded-lg p-6 space-y-4">
        <div className="space-y-1.5">
          <Label htmlFor="code">Code</Label>
          <Input id="code" value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })} placeholder="WELCOME20" required />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label>Type</Label>
            <Select value={form.type} onValueChange={(v) => setForm({ ...form, type: v as "PERCENTAGE" | "FIXED" })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="PERCENTAGE">Percentage (%)</SelectItem>
                <SelectItem value="FIXED">Fixed Amount ($)</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="value">Value</Label>
            <Input id="value" type="number" value={form.value} onChange={(e) => setForm({ ...form, value: Number(e.target.value) })} required />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label htmlFor="min">Min Order Value</Label>
            <Input id="min" type="number" value={form.minOrderValue} onChange={(e) => setForm({ ...form, minOrderValue: e.target.value })} placeholder="Optional" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="maxUses">Max Uses</Label>
            <Input id="maxUses" type="number" value={form.maxUses} onChange={(e) => setForm({ ...form, maxUses: e.target.value })} placeholder="Optional" />
          </div>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="expires">Expiry Date</Label>
          <Input id="expires" type="datetime-local" value={form.expiresAt} onChange={(e) => setForm({ ...form, expiresAt: e.target.value })} />
        </div>
        <div className="flex gap-3 pt-2">
          <Button type="submit" disabled={loading}>{loading ? "Creating..." : "Create Discount"}</Button>
          <Button type="button" variant="outline" onClick={() => router.back()}>Cancel</Button>
        </div>
      </form>
    </div>
  );
}
