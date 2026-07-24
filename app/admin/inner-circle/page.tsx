"use client";

import * as React from "react";
import { Crown, Mail, Phone } from "lucide-react";
import { toast } from "sonner";
import {
  useInnerCircle,
  useInnerCircleMutations,
} from "@/lib/hooks/useInnerCircle";
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
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { InnerCircleStatusBadge } from "@/components/shared/status-badge";
import { ListPagination } from "@/components/shared/list-pagination";
import { PAGE_SIZE } from "@/lib/constants/pagination";
import { fmtDate } from "@/lib/format";
import type { InnerCircleMember } from "@/types";
import { TableBodySkeleton } from "@/components/shared/page-skeletons";

type Filter = "all" | InnerCircleMember["status"];

export default function InnerCirclePage() {
  const { can } = useAuth();
  const [tab, setTab] = React.useState<Filter>("pending");
  const [page, setPage] = React.useState(1);
  const [acting, setActing] = React.useState<{
    member: InnerCircleMember;
    status: InnerCircleMember["status"];
  } | null>(null);
  const [note, setNote] = React.useState("");

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

  const { data, isLoading } = useInnerCircle(listParams);
  const { updateStatus } = useInnerCircleMutations();

  const members = data?.data ?? [];
  const total = data?.total ?? 0;
  const totalPages = data?.totalPages ?? 1;

  const tabCount = (value: Filter) =>
    tab === value ? ` (${total})` : "";

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-zinc-900 flex items-center gap-2">
          <Crown className="h-5 w-5 text-amber-500" />
          Inner Circle
        </h1>
        <p className="text-sm text-zinc-500 mt-1">
          Membership applications and approved members.
        </p>
      </div>

      <Tabs value={tab} onValueChange={(v) => setTab(v as Filter)}>
        <TabsList>
          <TabsTrigger value="all">All{tabCount("all")}</TabsTrigger>
          <TabsTrigger value="pending">Pending{tabCount("pending")}</TabsTrigger>
          <TabsTrigger value="approved">
            Approved{tabCount("approved")}
          </TabsTrigger>
          <TabsTrigger value="waitlisted">
            Waitlisted{tabCount("waitlisted")}
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
                    <TableHead>Applicant</TableHead>
                    <TableHead>Contact</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Applied</TableHead>
                    <TableHead>Notes</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading ? (
                    <TableBodySkeleton columns={6} />
                  ) : members.length === 0 ? (
                    <TableRow>
                      <TableCell
                        colSpan={6}
                        className="text-center py-8 text-zinc-500"
                      >
                        No applications in this category.
                      </TableCell>
                    </TableRow>
                  ) : (
                    members.map((m) => (
                      <TableRow key={m.id}>
                        <TableCell>
                          <div className="font-medium text-zinc-900">
                            {m.firstName} {m.lastName}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="text-xs text-zinc-600 flex items-center gap-1">
                            <Mail className="h-3 w-3" />
                            {m.email}
                          </div>
                          <div className="text-xs text-zinc-600 flex items-center gap-1">
                            <Phone className="h-3 w-3" />
                            {m.phone}
                          </div>
                        </TableCell>
                        <TableCell>
                          <InnerCircleStatusBadge status={m.status} />
                        </TableCell>
                        <TableCell className="text-xs text-zinc-500">
                          {fmtDate(m.appliedAt)}
                        </TableCell>
                        <TableCell className="text-xs text-zinc-500 max-w-50 line-clamp-2">
                          {m.notes || "—"}
                        </TableCell>
                        <TableCell className="text-right">
                          {can("edit") && m.status !== "approved" && (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-emerald-700"
                              onClick={() =>
                                setActing({ member: m, status: "approved" })
                              }
                            >
                              Approve
                            </Button>
                          )}
                          {can("edit") && m.status !== "waitlisted" && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() =>
                                setActing({ member: m, status: "waitlisted" })
                              }
                            >
                              Waitlist
                            </Button>
                          )}
                          {can("edit") && m.status !== "rejected" && (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-rose-600"
                              onClick={() =>
                                setActing({ member: m, status: "rejected" })
                              }
                            >
                              Reject
                            </Button>
                          )}
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
        </TabsContent>
      </Tabs>

      <Dialog open={!!acting} onOpenChange={(o) => !o && setActing(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {acting?.status === "approved"
                ? "Approve member"
                : acting?.status === "waitlisted"
                  ? "Add to waitlist"
                  : "Reject application"}
            </DialogTitle>
          </DialogHeader>
          {acting && (
            <div className="space-y-3">
              <p className="text-sm text-zinc-600">
                {acting.member.firstName} {acting.member.lastName} ·{" "}
                {acting.member.email}
              </p>
              <Textarea
                rows={3}
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="Optional note saved with the decision"
              />
            </div>
          )}
          <DialogFooter>
            <Button variant="ghost" onClick={() => setActing(null)}>
              Cancel
            </Button>
            <Button
              onClick={async () => {
                if (!acting) return;
                try {
                  await updateStatus.mutateAsync({
                    id: acting.member.id,
                    status: acting.status,
                    note: note || undefined,
                  });
                  toast.success(`Marked ${acting.status}.`);
                  setActing(null);
                  setNote("");
                } catch (e) {
                  toast.error(
                    e instanceof Error
                      ? e.message
                      : "Failed to update status.",
                  );
                }
              }}
            >
              Confirm
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
