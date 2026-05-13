"use client";

import { use, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { useDiscount, useUpdateDiscount } from "@/lib/hooks";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import Link from "next/link";

export default function EditDiscountPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const { data: discount, isLoading } = useDiscount(id);
  const updateDiscount = useUpdateDiscount();
  const [form, setForm] = useState({
    code: "",
    type: "PERCENTAGE" as "PERCENTAGE" | "FIXED",
    value: 0,
    minOrderValue: "",
    maxUses: "",
    expiresAt: "",
    active: true,
  });

  useEffect(() => {
    if (discount) {
      setForm({
        code: discount.code,
        type: discount.type,
        value: discount.value,
        minOrderValue: discount.minOrderValue != null ? String(discount.minOrderValue) : "",
        maxUses: discount.maxUses != null ? String(discount.maxUses) : "",
        expiresAt: discount.expiresAt
          ? discount.expiresAt.slice(0, 16)
          : "",
        active: discount.active,
      });
    }
  }, [discount]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateDiscount.mutate(
      {
        id,
        body: {
          code: form.code,
          type: form.type,
          value: form.value,
          minOrderValue: form.minOrderValue ? Number(form.minOrderValue) : null,
          maxUses: form.maxUses ? Number(form.maxUses) : null,
          expiresAt: form.expiresAt || null,
          active: form.active,
        },
      },
      {
        onSuccess: () => { toast.success("Discount updated"); router.push("/dashboard/discounts"); },
        onError: () => toast.error("Failed to update discount"),
      },
    );
  };

  if (isLoading) return <div className="h-48 bg-white border border-zinc-100 rounded-lg animate-pulse" />;
  if (!discount) return <div className="text-zinc-500">Discount not found.</div>;

  return (
    <div className="max-w-md space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-zinc-900">Edit Discount</h1>
        <Link href="/dashboard/discounts"><Button variant="outline">Back</Button></Link>
      </div>
      <form onSubmit={handleSubmit} className="bg-white border border-zinc-100 rounded-lg p-6 space-y-4">
        <div className="space-y-1.5">
          <Label htmlFor="code">Code</Label>
          <Input id="code" value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })} required />
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
          <Button type="submit" disabled={updateDiscount.isPending}>{updateDiscount.isPending ? "Saving..." : "Save Changes"}</Button>
          <Button type="button" variant="outline" onClick={() => router.back()}>Cancel</Button>
        </div>
      </form>
    </div>
  );
}
