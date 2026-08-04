"use client";

import * as React from "react";
import { Mail } from "lucide-react";
import { useNewsletter } from "@/lib/hooks/useNewsletter";
import { Card, CardContent } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { ListPagination } from "@/components/shared/list-pagination";
import { PAGE_SIZE } from "@/lib/constants/pagination";
import { fmtDate } from "@/lib/format";
import { TableBodySkeleton } from "@/components/shared/page-skeletons";

function sourceLabel(source: string): string {
  if (!source) return "—";
  return source.replace(/_/g, " ");
}

export default function NewsletterPage() {
  const [page, setPage] = React.useState(1);

  const listParams = React.useMemo(
    () => ({ page, pageSize: PAGE_SIZE }),
    [page],
  );

  const { data, isLoading } = useNewsletter(listParams);

  const subscribers = data?.data ?? [];
  const total = data?.total ?? 0;
  const totalPages = data?.totalPages ?? 1;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-zinc-900 flex items-center gap-2">
          <Mail className="h-5 w-5 text-zinc-700" />
          Newsletter
        </h1>
        <p className="text-sm text-zinc-500 mt-1">
          Emails collected from the storefront signup.
        </p>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Email</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Source</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Date</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableBodySkeleton columns={5} />
              ) : subscribers.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={5}
                    className="text-center py-12 text-zinc-500"
                  >
                    No subscribers yet.
                  </TableCell>
                </TableRow>
              ) : (
                subscribers.map((s) => (
                  <TableRow key={s.id}>
                    <TableCell className="text-sm font-medium text-zinc-900">
                      {s.email}
                    </TableCell>
                    <TableCell className="text-sm text-zinc-700">
                      {s.firstName?.trim() || "—"}
                    </TableCell>
                    <TableCell className="text-sm text-zinc-600 capitalize">
                      {sourceLabel(s.source)}
                    </TableCell>
                    <TableCell>
                      <Badge variant={s.isActive ? "emerald" : "zinc"}>
                        {s.isActive ? "Active" : "Inactive"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-xs text-zinc-500">
                      {fmtDate(s.createdAt)}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {total > 0 && (
        <ListPagination
          page={page}
          totalPages={totalPages}
          total={total}
          onPageChange={setPage}
        />
      )}
    </div>
  );
}
