"use client";

import * as React from "react";
import Link from "next/link";
import Image from "next/image";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Mail, Phone, MapPin, X, Plus } from "lucide-react";
import { toast } from "sonner";
import {
  useCustomer,
  useCustomerMutations,
  useCustomerOrders,
} from "@/lib/hooks/useCustomers";
import { useProducts } from "@/lib/hooks/useProducts";
import { useAuth } from "@/lib/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  CustomerStatusBadge,
  OrderStatusBadge,
} from "@/components/shared/status-badge";
import { fmtDate, formatMoney } from "@/lib/format";
import type { Customer } from "@/types";
import {
  DetailPageSkeleton,
  TableBodySkeleton,
} from "@/components/shared/page-skeletons";

export default function CustomerDetailPage() {
  const params = useParams<{ id: string }>();
  const customerId = decodeURIComponent(params.id ?? "");
  const router = useRouter();
  const { can } = useAuth();
  const {
    data: customer,
    isLoading,
    isError,
    error,
  } = useCustomer(customerId);
  const { data: orders = [], isLoading: ordersLoading } = useCustomerOrders(
    customerId,
  );
  const { data: productsPage } = useProducts();
  const { update } = useCustomerMutations();

  const products = productsPage?.data ?? [];

  const [notesDraft, setNotesDraft] = React.useState("");
  const [tagsDraft, setTagsDraft] = React.useState<string[]>([]);
  const [tagInput, setTagInput] = React.useState("");

  React.useEffect(() => {
    if (customer) {
      setNotesDraft(customer.notes);
      setTagsDraft(customer.tags);
    }
  }, [customer]);

  if (isLoading) {
    return <DetailPageSkeleton />;
  }

  if (isError || !customer) {
    return (
      <div className="space-y-4">
        <Button variant="ghost" onClick={() => router.push("/admin/customers")}>
          <ArrowLeft className="h-4 w-4" /> Back
        </Button>
        <Card>
          <CardContent className="p-12 text-center text-zinc-500">
            {error instanceof Error ? error.message : "Customer not found."}
          </CardContent>
        </Card>
      </div>
    );
  }

  const aov =
    customer.totalOrders === 0
      ? 0
      : customer.totalSpend / customer.totalOrders;

  const wishlistProducts = customer.wishlist
    .map((pid) => products.find((p) => p.id === pid || p.slug === pid))
    .filter((p): p is NonNullable<typeof p> => Boolean(p));

  const savePatch = async (patch: Partial<Customer>) => {
    try {
      await update.mutateAsync({ id: customer.id, patch });
      toast.success("Customer updated.");
    } catch (e) {
      toast.error(
        e instanceof Error ? e.message : "Failed to update customer.",
      );
    }
  };

  const addTag = () => {
    const tag = tagInput.trim();
    if (!tag || tagsDraft.includes(tag)) return;
    const next = [...tagsDraft, tag];
    setTagsDraft(next);
    setTagInput("");
    if (can("edit")) savePatch({ tags: next });
  };

  const removeTag = (tag: string) => {
    const next = tagsDraft.filter((t) => t !== tag);
    setTagsDraft(next);
    if (can("edit")) savePatch({ tags: next });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => router.push("/admin/customers")}
        >
          <ArrowLeft className="h-4 w-4" /> Back to customers
        </Button>
      </div>

      <Card>
        <CardContent className="p-6">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="flex items-start gap-4">
              <div className="h-14 w-14 rounded-full bg-zinc-900 text-white flex items-center justify-center text-lg font-semibold">
                {customer.firstName[0]}
                {customer.lastName[0]}
              </div>
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <h1 className="text-xl font-semibold text-zinc-900">
                    {customer.firstName} {customer.lastName}
                  </h1>
                  <CustomerStatusBadge status={customer.status} />
                </div>
                <div className="mt-2 text-sm text-zinc-600 space-y-0.5">
                  <div className="flex items-center gap-2">
                    <Mail className="h-3.5 w-3.5 text-zinc-400" />
                    {customer.email}
                  </div>
                  <div className="flex items-center gap-2">
                    <Phone className="h-3.5 w-3.5 text-zinc-400" />
                    {customer.phone}
                  </div>
                  <div className="flex items-center gap-2">
                    <MapPin className="h-3.5 w-3.5 text-zinc-400" />
                    {customer.city}, {customer.region}, {customer.country}
                  </div>
                </div>
                {can("edit") && (
                  <div className="mt-3 flex items-center gap-2">
                    <Label className="text-xs text-zinc-500 shrink-0">
                      Status
                    </Label>
                    <Select
                      value={customer.status}
                      onValueChange={(v) =>
                        savePatch({
                          status: v as Customer["status"],
                        })
                      }
                    >
                      <SelectTrigger className="h-8 w-40 text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="active">Active</SelectItem>
                        <SelectItem value="suspended">Suspended</SelectItem>
                        <SelectItem value="unverified">Unverified</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-6 text-right sm:grid-cols-3 max-lg:w-full max-lg:grid-cols-3 max-lg:gap-3 max-lg:text-left">
              <Stat label="Orders" value={customer.totalOrders.toString()} />
              <Stat
                label="Lifetime spend"
                value={formatMoney(customer.totalSpend)}
              />
              <Stat label="AOV" value={formatMoney(aov)} />
            </div>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="overview">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="orders">Orders ({orders.length})</TabsTrigger>
          <TabsTrigger value="addresses">
            Addresses ({customer.addresses.length})
          </TabsTrigger>
          <TabsTrigger value="wishlist">
            Wishlist ({wishlistProducts.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="mt-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-base font-semibold text-zinc-900">
                  Profile
                </CardTitle>
              </CardHeader>
              <CardContent className="text-sm space-y-2">
                <Row label="WhatsApp" value={customer.whatsapp || "—"} />
                <Row
                  label="Birthday"
                  value={
                    customer.birthDay && customer.birthMonth
                      ? `${customer.birthDay}/${customer.birthMonth}${customer.birthYear ? `/${customer.birthYear}` : ""}`
                      : "—"
                  }
                />
                <Row label="Top size" value={customer.topSize || "—"} />
                <Row label="Bottom size" value={customer.bottomSize || "—"} />
                <Row label="Joined" value={fmtDate(customer.joinedDate)} />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base font-semibold text-zinc-900">
                  Tags
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex flex-wrap gap-1.5">
                  {tagsDraft.length === 0 ? (
                    <span className="text-sm text-zinc-500">No tags yet.</span>
                  ) : (
                    tagsDraft.map((t) => (
                      <Badge key={t} variant="outline" className="gap-1">
                        {t}
                        {can("edit") && (
                          <button
                            type="button"
                            onClick={() => removeTag(t)}
                            className="hover:text-rose-600"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        )}
                      </Badge>
                    ))
                  )}
                </div>
                {can("edit") && (
                  <div className="flex items-center gap-2">
                    <Input
                      value={tagInput}
                      onChange={(e) => setTagInput(e.target.value)}
                      placeholder="Add tag (e.g. VIP)"
                      className="h-8 text-sm"
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          addTag();
                        }
                      }}
                    />
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={addTag}
                    >
                      <Plus className="h-3.5 w-3.5" />
                      Add
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle className="text-base font-semibold text-zinc-900">
                  Internal notes
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Textarea
                  rows={8}
                  readOnly={!can("edit")}
                  value={notesDraft}
                  onChange={(e) => setNotesDraft(e.target.value)}
                  onBlur={async () => {
                    if (!can("edit")) return;
                    if (notesDraft !== customer.notes) {
                      try {
                        await update.mutateAsync({
                          id: customer.id,
                          patch: { notes: notesDraft },
                        });
                        toast.success("Notes saved.");
                      } catch (e) {
                        toast.error(
                          e instanceof Error
                            ? e.message
                            : "Failed to save notes.",
                        );
                      }
                    }
                  }}
                  placeholder={
                    can("edit")
                      ? "Notes about this customer (saved on blur)"
                      : "No notes"
                  }
                />
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="orders" className="mt-4">
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Order</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Items</TableHead>
                    <TableHead>Total</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {ordersLoading ? (
                    <TableBodySkeleton columns={5} rows={4} />
                  ) : orders.length === 0 ? (
                    <TableRow>
                      <TableCell
                        colSpan={5}
                        className="text-center py-8 text-zinc-500"
                      >
                        No orders yet.
                      </TableCell>
                    </TableRow>
                  ) : (
                    orders.map((o) => (
                      <TableRow key={o.id}>
                        <TableCell>
                          <Link
                            href={`/admin/orders/${o.id}`}
                            className="font-medium hover:underline"
                          >
                            {o.id}
                          </Link>
                        </TableCell>
                        <TableCell className="text-sm text-zinc-600">
                          {fmtDate(o.createdAt)}
                        </TableCell>
                        <TableCell>
                          {o.items.reduce((s, i) => s + i.quantity, 0)}
                        </TableCell>
                        <TableCell className="text-sm">
                          {formatMoney(o.total)}
                        </TableCell>
                        <TableCell>
                          <OrderStatusBadge status={o.status} />
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="addresses" className="mt-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {customer.addresses.length === 0 ? (
              <Card className="md:col-span-2">
                <CardContent className="p-8 text-center text-sm text-zinc-500">
                  No saved addresses.
                </CardContent>
              </Card>
            ) : (
              customer.addresses.map((a) => (
                <Card key={a.id}>
                  <CardContent className="p-5 text-sm">
                    <div className="flex items-center justify-between mb-2">
                      <div className="font-semibold text-zinc-900">
                        {a.label}
                      </div>
                      {a.isDefault && <Badge variant="zinc">Default</Badge>}
                    </div>
                    <div className="text-zinc-700">
                      {a.firstName} {a.lastName}
                    </div>
                    <div className="text-zinc-600">{a.address}</div>
                    {a.address2 && (
                      <div className="text-zinc-600">{a.address2}</div>
                    )}
                    <div className="text-zinc-600">
                      {a.city}, {a.region}
                    </div>
                    <div className="text-zinc-600">{a.country}</div>
                    <div className="mt-2 text-xs text-zinc-500">{a.phone}</div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </TabsContent>

        <TabsContent value="wishlist" className="mt-4">
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {wishlistProducts.length === 0 ? (
              <Card className="col-span-full">
                <CardContent className="p-8 text-center text-sm text-zinc-500">
                  Wishlist is empty.
                </CardContent>
              </Card>
            ) : (
              wishlistProducts.map((p) => (
                <Link
                  key={p.id}
                  href={`/admin/products/${p.id}`}
                  className="group"
                >
                  <div className="relative aspect-square rounded-md overflow-hidden bg-zinc-100">
                    {p.variants[0]?.images[0] && (
                      <Image
                        src={p.variants[0].images[0]}
                        alt={p.name}
                        fill
                        sizes="(max-width:768px) 50vw, 25vw"
                        className="object-cover group-hover:scale-105 transition-transform"
                      />
                    )}
                  </div>
                  <div className="mt-2 text-sm font-medium text-zinc-900 line-clamp-1">
                    {p.name}
                  </div>
                  <div className="text-xs text-zinc-500">
                    {formatMoney(p.price)}
                  </div>
                </Link>
              ))
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-[10px] tracking-[0.2em] uppercase text-zinc-500">
        {label}
      </div>
      <div className="mt-1 text-base font-semibold text-zinc-900">{value}</div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-zinc-500">{label}</span>
      <span className="text-zinc-900">{value}</span>
    </div>
  );
}
