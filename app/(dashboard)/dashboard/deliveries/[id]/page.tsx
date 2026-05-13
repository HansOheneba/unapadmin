"use client";

import { use, useState } from "react";
import Link from "next/link";
import { ExternalLink } from "lucide-react";
import { toast } from "sonner";
import { useDelivery, useUpdateDelivery } from "@/lib/hooks";
import { StatusBadge } from "@/components/shared/status-badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { formatDate, formatDateTime } from "@/lib/utils";
import type { DeliveryStatus } from "@/types";

const STATUSES: DeliveryStatus[] = [
  "AWAITING_PICKUP",
  "IN_TRANSIT",
  "OUT_FOR_DELIVERY",
  "DELIVERED",
  "FAILED",
  "RETURNED_TO_SENDER",
];

export default function DeliveryDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const { data: delivery, isLoading } = useDelivery(id);
  const updateDelivery = useUpdateDelivery();
  const [form, setForm] = useState<{
    carrier: string;
    trackingNumber: string;
    trackingUrl: string;
    status: DeliveryStatus | "";
    estimatedDelivery: string;
  }>({
    carrier: "",
    trackingNumber: "",
    trackingUrl: "",
    status: "",
    estimatedDelivery: "",
  });
  const [initialized, setInitialized] = useState(false);

  if (delivery && !initialized) {
    setForm({
      carrier: delivery.carrier ?? "",
      trackingNumber: delivery.trackingNumber ?? "",
      trackingUrl: delivery.trackingUrl ?? "",
      status: delivery.status,
      estimatedDelivery: delivery.estimatedDelivery
        ? delivery.estimatedDelivery.slice(0, 16)
        : "",
    });
    setInitialized(true);
  }

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    updateDelivery.mutate(
      {
        id,
        body: {
          carrier: form.carrier || undefined,
          trackingNumber: form.trackingNumber || undefined,
          trackingUrl: form.trackingUrl || undefined,
          status: form.status || undefined,
          estimatedDelivery: form.estimatedDelivery || undefined,
        },
      },
      {
        onSuccess: () => toast.success("Delivery updated"),
        onError: () => toast.error("Failed to update delivery"),
      },
    );
  };

  if (isLoading)
    return (
      <div className="h-48 bg-white border border-zinc-100 rounded-lg animate-pulse" />
    );
  if (!delivery)
    return <div className="text-zinc-500">Delivery not found.</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-semibold text-zinc-900">
            {delivery.orderNumber}
          </h1>
          <StatusBadge status={delivery.status} />
        </div>
        <Link href="/dashboard/deliveries">
          <Button variant="outline">Back</Button>
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Edit form */}
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-white border border-zinc-100 rounded-lg p-5">
            <h2 className="font-semibold text-zinc-900 mb-4">Delivery Info</h2>
            <form onSubmit={handleSave} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="carrier">Carrier</Label>
                  <Input
                    id="carrier"
                    value={form.carrier}
                    onChange={(e) =>
                      setForm({ ...form, carrier: e.target.value })
                    }
                    placeholder="DHL, FedEx..."
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="tracking">Tracking Number</Label>
                  <Input
                    id="tracking"
                    value={form.trackingNumber}
                    onChange={(e) =>
                      setForm({ ...form, trackingNumber: e.target.value })
                    }
                  />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="trackingUrl">Tracking URL</Label>
                <Input
                  id="trackingUrl"
                  value={form.trackingUrl}
                  onChange={(e) =>
                    setForm({ ...form, trackingUrl: e.target.value })
                  }
                  placeholder="https://..."
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label>Status</Label>
                  <Select
                    value={form.status}
                    onValueChange={(v) =>
                      setForm({ ...form, status: v as DeliveryStatus })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Update status" />
                    </SelectTrigger>
                    <SelectContent>
                      {STATUSES.map((s) => (
                        <SelectItem key={s} value={s}>
                          {s.replace(/_/g, " ")}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="estDelivery">Est. Delivery</Label>
                  <Input
                    id="estDelivery"
                    type="datetime-local"
                    value={form.estimatedDelivery}
                    onChange={(e) =>
                      setForm({ ...form, estimatedDelivery: e.target.value })
                    }
                  />
                </div>
              </div>
              <Button type="submit" disabled={updateDelivery.isPending}>
                {updateDelivery.isPending ? "Saving..." : "Save Changes"}
              </Button>
            </form>
          </div>

          {/* Tracking events */}
          <div className="bg-white border border-zinc-100 rounded-lg p-5">
            <h2 className="font-semibold text-zinc-900 mb-4">
              Tracking Events
            </h2>
            {delivery.events.length === 0 ? (
              <p className="text-zinc-400 text-sm">No tracking events yet.</p>
            ) : (
              <ol className="space-y-4">
                {delivery.events.map((event, i) => (
                  <li key={i} className="flex gap-3">
                    <div className="flex flex-col items-center">
                      <div className="h-2.5 w-2.5 rounded-full bg-black mt-0.5" />
                      {i < delivery.events.length - 1 && (
                        <div className="w-px flex-1 bg-zinc-100 mt-1" />
                      )}
                    </div>
                    <div className="pb-4">
                      <p className="text-zinc-800 font-medium">
                        {event.description}
                      </p>
                      {event.location && (
                        <p className="text-xs text-zinc-500">
                          {event.location}
                        </p>
                      )}
                      <p className="text-xs text-zinc-400 mt-0.5">
                        {formatDateTime(event.at)}
                      </p>
                    </div>
                  </li>
                ))}
              </ol>
            )}
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          <div className="bg-white border border-zinc-100 rounded-lg p-5 space-y-2">
            <h2 className="font-semibold text-zinc-900">Customer</h2>
            <p className="text-zinc-800 font-medium">
              {delivery.customer.name ?? "N/A"}
            </p>
            <p className="text-sm text-zinc-500">{delivery.customer.email}</p>
            <div className="pt-2 border-t border-zinc-50 text-sm">
              <p className="text-zinc-500">Ship to</p>
              <p className="text-zinc-800">{delivery.address}</p>
              <p className="text-zinc-800">
                {delivery.city}, {delivery.country}
              </p>
            </div>
            {delivery.trackingUrl && (
              <a
                href={delivery.trackingUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-sm text-zinc-500 hover:text-zinc-900 mt-2"
              >
                Track Package <ExternalLink className="h-3 w-3" />
              </a>
            )}
          </div>
          {delivery.deliveredAt && (
            <div className="bg-green-50 border border-green-100 rounded-lg p-4 text-sm">
              <p className="text-green-700 font-medium">Delivered</p>
              <p className="text-green-600">
                {formatDate(delivery.deliveredAt)}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
