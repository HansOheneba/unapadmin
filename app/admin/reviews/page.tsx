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
import { useAdminStore } from "@/lib/store";
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
import { ReviewStatusBadge } from "@/components/shared/status-badge";
import { fmtDate } from "@/lib/format";
import type { Review } from "@/types";

type Filter = "all" | Review["status"];

export default function ReviewsPage() {
  const { can } = useAuth();
  const reviews = useAdminStore((s) => s.reviews);
  const updateStatus = useAdminStore((s) => s.updateReviewStatus);
  const remove = useAdminStore((s) => s.deleteReview);

  const [tab, setTab] = React.useState<Filter>("pending");
  const [expanded, setExpanded] = React.useState<string | null>(null);
  const [noteDraft, setNoteDraft] = React.useState<Record<string, string>>({});
  const [toDelete, setToDelete] = React.useState<string | null>(null);

  const counts = {
    all: reviews.length,
    pending: reviews.filter((r) => r.status === "pending").length,
    approved: reviews.filter((r) => r.status === "approved").length,
    rejected: reviews.filter((r) => r.status === "rejected").length,
  };

  const filtered = reviews
    .filter((r) => (tab === "all" ? true : r.status === tab))
    .sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    );

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

      <Tabs value={tab} onValueChange={(v) => setTab(v as Filter)}>
        <TabsList>
          <TabsTrigger value="all">All ({counts.all})</TabsTrigger>
          <TabsTrigger value="pending">Pending ({counts.pending})</TabsTrigger>
          <TabsTrigger value="approved">
            Approved ({counts.approved})
          </TabsTrigger>
          <TabsTrigger value="rejected">
            Rejected ({counts.rejected})
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
                  {filtered.length === 0 ? (
                    <TableRow>
                      <TableCell
                        colSpan={7}
                        className="text-center py-8 text-zinc-500"
                      >
                        No reviews in this category.
                      </TableCell>
                    </TableRow>
                  ) : (
                    filtered.map((r) => {
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
                                  onClick={() => {
                                    updateStatus(r.id, "approved");
                                    toast.success("Review approved.");
                                  }}
                                >
                                  Approve
                                </Button>
                              )}
                              {can("edit") && r.status !== "rejected" && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => {
                                    updateStatus(r.id, "rejected");
                                    toast.success("Review rejected.");
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
                                      onBlur={() => {
                                        if (!can("edit")) return;
                                        const v =
                                          noteDraft[r.id] ?? r.adminNote;
                                        if (v !== r.adminNote) {
                                          updateStatus(r.id, r.status, v);
                                          toast.success("Note saved.");
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
        onConfirm={() => {
          if (toDelete) {
            remove(toDelete);
            toast.success("Review deleted.");
            setToDelete(null);
          }
        }}
      />
    </div>
  );
}
