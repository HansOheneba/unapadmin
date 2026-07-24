"use client";

import * as React from "react";
import Link from "next/link";
import {
  Star,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";
import { useReviewMutations, useReviews } from "@/lib/hooks/useReviews";
import { useAuth } from "@/lib/hooks/useAuth";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { ListPagination } from "@/components/shared/list-pagination";
import { ReviewStatusBadge } from "@/components/shared/status-badge";
import { PAGE_SIZE } from "@/lib/constants/pagination";
import { fmtDate } from "@/lib/format";
import type { Review } from "@/types";
import { TableBodySkeleton } from "@/components/shared/page-skeletons";

type Filter = "all" | Review["status"];

export default function ReviewsPage() {
  const { can } = useAuth();
  const [tab, setTab] = React.useState<Filter>("pending");
  const [page, setPage] = React.useState(1);
  const [expanded, setExpanded] = React.useState<string | null>(null);
  const [noteDraft, setNoteDraft] = React.useState<Record<string, string>>({});
  const [toDelete, setToDelete] = React.useState<string | null>(null);

  React.useEffect(() => {
    setPage(1);
  }, [tab]);

  const listParams = React.useMemo(
    () => ({
      ...(tab !== "all" ? { status: tab } : {}),
      page,
      pageSize: PAGE_SIZE,
    }),
    [tab, page],
  );

  const { data, isLoading } = useReviews(listParams);
  const { updateStatus, remove } = useReviewMutations();

  const reviews = data?.data ?? [];
  const total = data?.total ?? 0;
  const totalPages = data?.totalPages ?? 1;

  const tabCount = (value: Filter) =>
    tab === value ? ` (${total})` : "";

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-zinc-900 flex items-center gap-2">
          <Star className="h-5 w-5 text-amber-500" />
          Reviews
        </h1>
        <p className="text-sm text-zinc-500 mt-1">
          Approve, reject, or remove customer reviews.
        </p>
      </div>

      <Tabs
        value={tab}
        onValueChange={(v) => {
          setTab(v as Filter);
          setExpanded(null);
        }}
      >
        <TabsList>
          <TabsTrigger value="all">All{tabCount("all")}</TabsTrigger>
          <TabsTrigger value="pending">Pending{tabCount("pending")}</TabsTrigger>
          <TabsTrigger value="approved">
            Approved{tabCount("approved")}
          </TabsTrigger>
          <TabsTrigger value="rejected">
            Rejected{tabCount("rejected")}
          </TabsTrigger>
        </TabsList>

        <TabsContent value={tab} className="mt-4">
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-8" />
                    <TableHead>Author</TableHead>
                    <TableHead>Product</TableHead>
                    <TableHead>Rating</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading ? (
                    <TableBodySkeleton columns={7} />
                  ) : reviews.length === 0 ? (
                    <TableRow>
                      <TableCell
                        colSpan={7}
                        className="text-center py-8 text-zinc-500"
                      >
                        No reviews in this category.
                      </TableCell>
                    </TableRow>
                  ) : (
                    reviews.map((r) => {
                      const isOpen = expanded === r.id;
                      return (
                        <React.Fragment key={r.id}>
                          <TableRow>
                            <TableCell>
                              <Button
                                size="icon"
                                variant="ghost"
                                className="h-7 w-7"
                                onClick={() =>
                                  setExpanded(isOpen ? null : r.id)
                                }
                              >
                                {isOpen ? (
                                  <ChevronDown className="h-4 w-4" />
                                ) : (
                                  <ChevronRight className="h-4 w-4" />
                                )}
                              </Button>
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-1">
                                <span className="font-medium text-zinc-900">
                                  {r.author}
                                </span>
                                {r.verified && (
                                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
                                )}
                              </div>
                              {r.email && (
                                <div className="text-xs text-zinc-500">
                                  {r.email}
                                </div>
                              )}
                            </TableCell>
                            <TableCell>
                              <Link
                                href={`/admin/products/${r.productId}`}
                                className="text-sm hover:underline"
                              >
                                {r.productName}
                              </Link>
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-0.5">
                                {Array.from({ length: 5 }).map((_, i) => (
                                  <Star
                                    key={i}
                                    className={`h-3.5 w-3.5 ${
                                      i < r.rating
                                        ? "fill-amber-400 text-amber-400"
                                        : "text-zinc-300"
                                    }`}
                                  />
                                ))}
                              </div>
                            </TableCell>
                            <TableCell>
                              <ReviewStatusBadge status={r.status} />
                            </TableCell>
                            <TableCell className="text-xs text-zinc-500">
                              {fmtDate(r.createdAt)}
                            </TableCell>
                            <TableCell className="text-right">
                              {can("edit") && r.status !== "approved" && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="text-emerald-700"
                                  onClick={async () => {
                                    try {
                                      await updateStatus.mutateAsync({
                                        id: r.id,
                                        status: "approved",
                                      });
                                      toast.success("Review approved.");
                                    } catch (e) {
                                      toast.error(
                                        e instanceof Error
                                          ? e.message
                                          : "Failed to approve review.",
                                      );
                                    }
                                  }}
                                >
                                  Approve
                                </Button>
                              )}
                              {can("edit") && r.status !== "rejected" && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={async () => {
                                    try {
                                      await updateStatus.mutateAsync({
                                        id: r.id,
                                        status: "rejected",
                                      });
                                      toast.success("Review rejected.");
                                    } catch (e) {
                                      toast.error(
                                        e instanceof Error
                                          ? e.message
                                          : "Failed to reject review.",
                                      );
                                    }
                                  }}
                                >
                                  Reject
                                </Button>
                              )}
                              {can("delete") && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="text-rose-600"
                                  onClick={() => setToDelete(r.id)}
                                >
                                  <Trash2 className="h-3.5 w-3.5" />
                                </Button>
                              )}
                            </TableCell>
                          </TableRow>
                          {isOpen && (
                            <TableRow>
                              <TableCell colSpan={7} className="bg-zinc-50/50">
                                <div className="space-y-3 py-3">
                                  {r.title && (
                                    <div className="font-semibold text-zinc-900">
                                      {r.title}
                                    </div>
                                  )}
                                  <p className="text-sm text-zinc-700 whitespace-pre-line">
                                    {r.body}
                                  </p>
                                  <div className="pt-2">
                                    <label className="text-xs font-medium text-zinc-500">
                                      Admin note
                                    </label>
                                    <Textarea
                                      rows={2}
                                      className="mt-1"
                                      readOnly={!can("edit")}
                                      value={noteDraft[r.id] ?? r.adminNote}
                                      onChange={(e) =>
                                        setNoteDraft((d) => ({
                                          ...d,
                                          [r.id]: e.target.value,
                                        }))
                                      }
                                      onBlur={async () => {
                                        if (!can("edit")) return;
                                        const v =
                                          noteDraft[r.id] ?? r.adminNote;
                                        if (v !== r.adminNote) {
                                          try {
                                            await updateStatus.mutateAsync({
                                              id: r.id,
                                              status: r.status,
                                              adminNote: v,
                                            });
                                            toast.success("Note saved.");
                                          } catch (e) {
                                            toast.error(
                                              e instanceof Error
                                                ? e.message
                                                : "Failed to save note.",
                                            );
                                          }
                                        }
                                      }}
                                    />
                                  </div>
                                </div>
                              </TableCell>
                            </TableRow>
                          )}
                        </React.Fragment>
                      );
                    })
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
        </TabsContent>
      </Tabs>

      <ConfirmDialog
        open={!!toDelete}
        onOpenChange={(o) => !o && setToDelete(null)}
        title="Delete review?"
        description="This permanently removes the review."
        destructive
        confirmText="Delete review"
        onConfirm={async () => {
          if (!toDelete) return;
          try {
            await remove.mutateAsync(toDelete);
            toast.success("Review deleted.");
            setToDelete(null);
          } catch (e) {
            toast.error(
              e instanceof Error ? e.message : "Failed to delete review.",
            );
          }
        }}
      />
    </div>
  );
}
