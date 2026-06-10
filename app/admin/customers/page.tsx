"use client";

import * as React from "react";
import Link from "next/link";
import { Search, X, Crown } from "lucide-react";
import { useCustomers } from "@/lib/hooks/useCustomers";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { CustomerStatusBadge } from "@/components/shared/status-badge";
import { ListPagination } from "@/components/shared/list-pagination";
import { PAGE_SIZE } from "@/lib/constants/pagination";
import { fmtDate, formatMoney, relative } from "@/lib/format";

export default function CustomersPage() {
  const [status, setStatus] = React.useState<
    "all" | "active" | "suspended" | "unverified"
  >("all");
  const [country, setCountry] = React.useState<"all" | "Ghana" | "Nigeria">(
    "all",
  );
  const [innerCircle, setInnerCircle] = React.useState<"all" | "yes" | "no">(
    "all",
  );
  const [q, setQ] = React.useState("");
  const [page, setPage] = React.useState(1);

  const listParams = React.useMemo(
    () => ({
      status: status === "all" ? undefined : status,
      country: country === "all" ? undefined : country,
      innerCircle:
        innerCircle === "all" ? undefined : innerCircle === "yes" ? "true" : "false",
      q: q || undefined,
      page,
      pageSize: PAGE_SIZE,
    }),
    [status, country, innerCircle, q, page],
  );

  React.useEffect(() => {
    setPage(1);
  }, [status, country, innerCircle, q]);

  const { data, isLoading } = useCustomers(listParams);
  const customers = data?.data ?? [];
  const total = data?.total ?? 0;
  const totalPages = data?.totalPages ?? 1;

  const clear = () => {
    setStatus("all");
    setCountry("all");
    setInnerCircle("all");
    setQ("");
    setPage(1);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-zinc-900">Customers</h1>
        <p className="text-sm text-zinc-500 mt-1">
          {total} customer{total === 1 ? "" : "s"}
        </p>
      </div>

      <Card>
        <CardContent className="p-4 grid grid-cols-1 md:grid-cols-5 gap-3">
          <div className="md:col-span-2 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
            <Input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search name, email, phone..."
              className="pl-9"
            />
          </div>
          <Select value={status} onValueChange={(v) => setStatus(v as never)}>
            <SelectTrigger>
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All statuses</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="suspended">Suspended</SelectItem>
              <SelectItem value="unverified">Unverified</SelectItem>
            </SelectContent>
          </Select>
          <Select value={country} onValueChange={(v) => setCountry(v as never)}>
            <SelectTrigger>
              <SelectValue placeholder="Country" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All countries</SelectItem>
              <SelectItem value="Ghana">🇬🇭 Ghana</SelectItem>
              <SelectItem value="Nigeria">🇳🇬 Nigeria</SelectItem>
            </SelectContent>
          </Select>
          <Select
            value={innerCircle}
            onValueChange={(v) => setInnerCircle(v as never)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Inner Circle" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All customers</SelectItem>
              <SelectItem value="yes">Inner Circle</SelectItem>
              <SelectItem value="no">Standard</SelectItem>
            </SelectContent>
          </Select>
          {(status !== "all" ||
            country !== "all" ||
            innerCircle !== "all" ||
            q) && (
            <Button
              variant="ghost"
              size="sm"
              onClick={clear}
              className="md:col-span-5 justify-self-start text-xs"
            >
              <X className="h-3 w-3" /> Clear filters
            </Button>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Customer</TableHead>
                <TableHead>Country</TableHead>
                <TableHead>Orders</TableHead>
                <TableHead>Lifetime spend</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Last order</TableHead>
                <TableHead>Joined</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell
                    colSpan={7}
                    className="text-center py-12 text-zinc-500"
                  >
                    Loading customers...
                  </TableCell>
                </TableRow>
              ) : customers.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={7}
                    className="text-center py-12 text-zinc-500"
                  >
                    No customers match the current filters.
                  </TableCell>
                </TableRow>
              ) : (
                customers.map((c) => (
                  <TableRow key={c.id}>
                    <TableCell>
                      <Link
                        href={`/admin/customers/${c.id}`}
                        className="block hover:underline"
                      >
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-zinc-900">
                            {c.firstName} {c.lastName}
                          </span>
                          {c.innerCircle && (
                            <Crown className="h-3.5 w-3.5 text-amber-500" />
                          )}
                        </div>
                        <div className="text-xs text-zinc-500">{c.email}</div>
                      </Link>
                    </TableCell>
                    <TableCell className="text-sm">
                      {c.country === "Ghana" ? "🇬🇭" : "🇳🇬"} {c.country}
                    </TableCell>
                    <TableCell>{c.totalOrders}</TableCell>
                    <TableCell className="text-sm">
                      {formatMoney(c.totalSpend)}
                    </TableCell>
                    <TableCell>
                      <CustomerStatusBadge status={c.status} />
                    </TableCell>
                    <TableCell className="text-xs text-zinc-500">
                      {c.lastOrderDate ? relative(c.lastOrderDate) : "Never"}
                    </TableCell>
                    <TableCell className="text-xs text-zinc-500">
                      {fmtDate(c.joinedDate)}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
          <ListPagination
            page={page}
            totalPages={totalPages}
            total={total}
            onPageChange={setPage}
          />
        </CardContent>
      </Card>
    </div>
  );
}
