"use client";

import * as React from "react";
import { Crown, Mail, Phone } from "lucide-react";
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
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { InnerCircleStatusBadge } from "@/components/shared/status-badge";
import { fmtDate } from "@/lib/format";
import type { InnerCircleMember } from "@/types";

type Filter = "all" | InnerCircleMember["status"];

export default function InnerCirclePage() {
  const { can } = useAuth();
  const members = useAdminStore((s) => s.innerCircle);
  const updateStatus = useAdminStore((s) => s.updateInnerCircleStatus);

  const [tab, setTab] = React.useState<Filter>("pending");
  const [acting, setActing] = React.useState<{
    member: InnerCircleMember;
    status: InnerCircleMember["status"];
  } | null>(null);
  const [note, setNote] = React.useState("");

  const counts = {
    all: members.length,
    pending: members.filter((m) => m.status === "pending").length,
    approved: members.filter((m) => m.status === "approved").length,
    rejected: members.filter((m) => m.status === "rejected").length,
    waitlisted: members.filter((m) => m.status === "waitlisted").length,
  };

  const filtered = members
    .filter((m) => (tab === "all" ? true : m.status === tab))
    .sort(
      (a, b) =>
        new Date(b.appliedAt).getTime() - new Date(a.appliedAt).getTime(),
    );

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

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Stat label="Pending" value={counts.pending} tone="amber" />
        <Stat label="Approved" value={counts.approved} tone="emerald" />
        <Stat label="Waitlisted" value={counts.waitlisted} tone="blue" />
        <Stat label="Rejected" value={counts.rejected} tone="rose" />
      </div>

      <Tabs value={tab} onValueChange={(v) => setTab(v as Filter)}>
        <TabsList>
          <TabsTrigger value="all">All ({counts.all})</TabsTrigger>
          <TabsTrigger value="pending">Pending ({counts.pending})</TabsTrigger>
          <TabsTrigger value="approved">
            Approved ({counts.approved})
          </TabsTrigger>
          <TabsTrigger value="waitlisted">
            Waitlisted ({counts.waitlisted})
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
                    <TableHead>Applicant</TableHead>
                    <TableHead>Contact</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Applied</TableHead>
                    <TableHead>Notes</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.length === 0 ? (
                    <TableRow>
                      <TableCell
                        colSpan={6}
                        className="text-center py-8 text-zinc-500"
                      >
                        No applications in this category.
                      </TableCell>
                    </TableRow>
                  ) : (
                    filtered.map((m) => (
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
              onClick={() => {
                if (!acting) return;
                updateStatus(acting.member.id, acting.status, note);
                toast.success(`Marked ${acting.status}.`);
                setActing(null);
                setNote("");
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

function Stat({
  label,
  value,
  tone,
}: {
  label: string;
  value: number;
  tone: "amber" | "emerald" | "blue" | "rose";
}) {
  const colors = {
    amber: "text-amber-600",
    emerald: "text-emerald-600",
    blue: "text-blue-600",
    rose: "text-rose-600",
  } as const;
  return (
    <Card>
      <CardContent className="p-5">
        <div className="text-[10px] tracking-[0.2em] uppercase text-zinc-500">
          {label}
        </div>
        <div className={`mt-2 text-2xl font-semibold ${colors[tone]}`}>
          {value}
        </div>
      </CardContent>
    </Card>
  );
}
