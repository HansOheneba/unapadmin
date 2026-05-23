"use client";

import * as React from "react";
import Link from "next/link";
import Image from "next/image";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Crown, Mail, Phone, MapPin } from "lucide-react";
import { toast } from "sonner";
import { useAdminStore } from "@/lib/store";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
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

export default function CustomerDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const customers = useAdminStore((s) => s.customers);
  const allOrders = useAdminStore((s) => s.orders);
  const products = useAdminStore((s) => s.products);
  const updateCustomer = useAdminStore((s) => s.updateCustomer);

  const customer = customers.find((c) => c.id === params.id);
  const orders = allOrders.filter((o) => o.customerId === params.id);

  const [notesDraft, setNotesDraft] = React.useState(customer?.notes ?? "");
  const [prevCustomerId, setPrevCustomerId] = React.useState(customer?.id);
  if (customer && prevCustomerId !== customer.id) {
    setPrevCustomerId(customer.id);
    setNotesDraft(customer.notes);
  }

  if (!customer) {
    return (
      <div className="space-y-4">
        <Button variant="ghost" onClick={() => router.push("/admin/customers")}>
          <ArrowLeft className="h-4 w-4" /> Back
        </Button>
        <Card>
          <CardContent className="p-12 text-center text-zinc-500">
            Customer not found.
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
    .map((pid) => products.find((p) => p.id === pid))
    .filter((p): p is NonNullable<typeof p> => Boolean(p));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Button variant="ghost" size="sm" onClick={() => router.push("/admin/customers")}>
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
                <div className="flex items-center gap-2">
                  <h1 className="text-xl font-semibold text-zinc-900">
                    {customer.firstName} {customer.lastName}
                  </h1>
                  {customer.innerCircle && (
                    <Badge variant="amber">
                      <Crown className="h-3 w-3" />
                      Inner Circle
                    </Badge>
                  )}
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
                {customer.tags.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {customer.tags.map((t) => (
                      <Badge key={t} variant="outline">
                        {t}
                      </Badge>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-6 text-right">
              <Stat label="Orders" value={customer.totalOrders.toString()} />
              <Stat
                label="Lifetime spend"
                value={formatMoney(customer.totalSpend, customer.currency)}
              />
              <Stat label="AOV" value={formatMoney(aov, customer.currency)} />
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
                  Internal notes
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Textarea
                  rows={8}
                  value={notesDraft}
                  onChange={(e) => setNotesDraft(e.target.value)}
                  onBlur={() => {
                    if (notesDraft !== customer.notes) {
                      updateCustomer(customer.id, { notes: notesDraft });
                      toast.success("Notes saved.");
                    }
                  }}
                  placeholder="Notes about this customer (saved on blur)"
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
                  {orders.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-8 text-zinc-500">
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
                          {formatMoney(o.total, o.currency)}
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
                      <div className="font-semibold text-zinc-900">{a.label}</div>
                      {a.isDefault && (
                        <Badge variant="zinc">Default</Badge>
                      )}
                    </div>
                    <div className="text-zinc-700">
                      {a.firstName} {a.lastName}
                    </div>
                    <div className="text-zinc-600">{a.address}</div>
                    {a.address2 && <div className="text-zinc-600">{a.address2}</div>}
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
                    {formatMoney(p.price, customer.currency)}
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
