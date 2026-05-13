"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { createAffiliate } from "@/lib/api/affiliates";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function NewAffiliatePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    name: "",
    email: "",
    code: "",
    commissionRate: 10,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await createAffiliate({
        name: form.name,
        email: form.email,
        code: form.code.toUpperCase(),
        commissionRate: form.commissionRate / 100,
        active: true,
      });
      toast.success("Affiliate added");
      router.push("/dashboard/affiliates");
    } catch {
      toast.error("Failed to add affiliate");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md space-y-6">
      <h1 className="text-2xl font-semibold text-zinc-900">Add Affiliate</h1>
      <form
        onSubmit={handleSubmit}
        className="bg-white border border-zinc-100 rounded-lg p-6 space-y-4"
      >
        <div className="space-y-1.5">
          <Label htmlFor="name">Name</Label>
          <Input
            id="name"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            required
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            required
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="code">Promo Code</Label>
          <Input
            id="code"
            value={form.code}
            onChange={(e) => setForm({ ...form, code: e.target.value })}
            placeholder="JANESMITH10"
            required
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="commission">Commission Rate (%)</Label>
          <Input
            id="commission"
            type="number"
            min="1"
            max="100"
            value={form.commissionRate}
            onChange={(e) =>
              setForm({ ...form, commissionRate: Number(e.target.value) })
            }
            required
          />
        </div>
        <div className="flex gap-3 pt-2">
          <Button type="submit" disabled={loading}>
            {loading ? "Adding..." : "Add Affiliate"}
          </Button>
          <Button type="button" variant="outline" onClick={() => router.back()}>
            Cancel
          </Button>
        </div>
      </form>
    </div>
  );
}
