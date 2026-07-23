"use client";

import * as React from "react";
import { Bike, Mail, Phone, Plus, Search, Car } from "lucide-react";
import { toast } from "sonner";
import { useRiders, useRiderMutations } from "@/lib/hooks/useRiders";
import { useAuth } from "@/lib/hooks/useAuth";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { ListPagination } from "@/components/shared/list-pagination";
import { RiderStatusBadge } from "@/components/shared/status-badge";
import { PAGE_SIZE } from "@/lib/constants/pagination";
import { fmtDate } from "@/lib/format";
import { TableBodySkeleton } from "@/components/shared/page-skeletons";
import type { Rider, RiderStatus, VehicleType } from "@/types";

type StatusFilter = "all" | RiderStatus;

const VEHICLE_LABELS: Record<VehicleType, string> = {
  motorcycle: "Motorcycle",
  bicycle: "Bicycle",
  car: "Car",
  van: "Van",
};

const emptyRider = (): Rider => ({
  id: "",
  firstName: "",
  lastName: "",
  phone: "",
  whatsapp: null,
  email: null,
  country: "Ghana",
  city: "Accra",
  zone: "",
  status: "active",
  vehicleType: "motorcycle",
  plateNumber: "",
  vehicleMake: null,
  vehicleModel: null,
  vehicleColor: null,
  licenseNumber: null,
  notes: "",
  activeDeliveries: 0,
  totalDeliveries: 0,
  joinedAt: new Date().toISOString(),
  createdAt: "",
  updatedAt: "",
});

export default function RidersPage() {
  const { can } = useAuth();
  const [tab, setTab] = React.useState<StatusFilter>("all");
  const [q, setQ] = React.useState("");
  const [page, setPage] = React.useState(1);
  const [editing, setEditing] = React.useState<Rider | null>(null);
  const [viewing, setViewing] = React.useState<Rider | null>(null);
  const [toDelete, setToDelete] = React.useState<string | null>(null);

  React.useEffect(() => {
    setPage(1);
  }, [tab, q]);

  const listParams = React.useMemo(
    () => ({
      ...(tab !== "all" ? { status: tab } : {}),
      ...(q ? { q } : {}),
      page,
      pageSize: PAGE_SIZE,
    }),
    [tab, q, page],
  );

  const { data, isLoading, isError, error, refetch } = useRiders(listParams);
  const { data: allCount } = useRiders({ page: 1, pageSize: 1 });
  const { data: activeCount } = useRiders({
    status: "active",
    page: 1,
    pageSize: 1,
  });
  const { data: inactiveCount } = useRiders({
    status: "inactive",
    page: 1,
    pageSize: 1,
  });
  const { upsert, remove } = useRiderMutations();

  const riders = data?.data ?? [];
  const total = data?.total ?? 0;
  const totalPages = data?.totalPages ?? 1;

  const counts = {
    all: allCount?.total ?? 0,
    active: activeCount?.total ?? 0,
    inactive: inactiveCount?.total ?? 0,
  };

  const toggleStatus = async (rider: Rider) => {
    const next = rider.status === "active" ? "inactive" : "active";
    try {
      await upsert.mutateAsync({ ...rider, status: next });
      toast.success(next === "active" ? "Rider activated." : "Rider deactivated.");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not update rider status.");
    }
  };

  const handleSave = async () => {
    if (!editing) return;
    if (!editing.firstName.trim() || !editing.lastName.trim()) {
      toast.error("First and last name are required.");
      return;
    }
    if (!editing.phone.trim()) {
      toast.error("Phone number is required.");
      return;
    }
    if (!editing.plateNumber.trim()) {
      toast.error("Plate number is required.");
      return;
    }
    try {
      await upsert.mutateAsync({
        ...editing,
        country: "Ghana",
        city: "Accra",
      });
      toast.success(editing.id ? "Rider updated." : "Rider added.");
      setEditing(null);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not save rider.");
    }
  };

  const handleDelete = async () => {
    if (!toDelete) return;
    try {
      await remove.mutateAsync(toDelete);
      toast.success("Rider removed.");
      setToDelete(null);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not remove rider.");
    }
  };

  if (isError) {
    return (
      <div className="py-12 text-center space-y-3">
        <p className="text-sm text-rose-600">
          {error instanceof Error ? error.message : "Failed to load riders."}
        </p>
        <Button variant="outline" onClick={() => refetch()}>
          Retry
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-zinc-900 flex items-center gap-2">
            <Bike className="h-5 w-5" />
            Riders
          </h1>
          <p className="text-sm text-zinc-500 mt-1">
            Accra in-house delivery team. Only active riders appear in order
            assignment.
          </p>
        </div>
        {can("create") && (
          <Button onClick={() => setEditing(emptyRider())}>
            <Plus className="h-4 w-4" /> Add rider
          </Button>
        )}
      </div>

      <div className="grid grid-cols-3 gap-4 max-w-lg">
        <Stat label="Total" value={counts.all} />
        <Stat label="Active" value={counts.active} tone="emerald" />
        <Stat label="Inactive" value={counts.inactive} tone="zinc" />
      </div>

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
        <Input
          className="pl-9"
          placeholder="Search name, plate, zone..."
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
      </div>

      <Tabs value={tab} onValueChange={(v) => setTab(v as StatusFilter)}>
        <TabsList>
          <TabsTrigger value="all">All ({counts.all})</TabsTrigger>
          <TabsTrigger value="active">Active ({counts.active})</TabsTrigger>
          <TabsTrigger value="inactive">
            Inactive ({counts.inactive})
          </TabsTrigger>
        </TabsList>

        <TabsContent value={tab} className="mt-4">
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Rider</TableHead>
                    <TableHead>Contact</TableHead>
                    <TableHead>Vehicle</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Deliveries</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading ? (
                    <TableBodySkeleton columns={6} />
                  ) : riders.length === 0 ? (
                    <TableRow>
                      <TableCell
                        colSpan={6}
                        className="text-center py-10 text-sm text-zinc-500"
                      >
                        No riders found.
                      </TableCell>
                    </TableRow>
                  ) : (
                    riders.map((r) => (
                      <TableRow key={r.id} className="hover:bg-zinc-50">
                        <TableCell>
                          <div className="font-medium text-zinc-900">
                            {r.firstName} {r.lastName}
                          </div>
                          <div className="text-xs text-zinc-500">
                            Joined {fmtDate(r.joinedAt)}
                          </div>
                          {r.zone && (
                            <div className="text-xs text-zinc-500 mt-0.5 max-w-[200px] truncate">
                              {r.zone}
                            </div>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1.5 text-sm">
                            <Phone className="h-3.5 w-3.5 text-zinc-400" />
                            {r.phone}
                          </div>
                          {r.email && (
                            <div className="flex items-center gap-1.5 text-xs text-zinc-500 mt-0.5">
                              <Mail className="h-3 w-3" />
                              {r.email}
                            </div>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="text-sm font-medium">
                            {VEHICLE_LABELS[r.vehicleType]}
                          </div>
                          <div className="text-xs font-mono text-zinc-600 mt-0.5">
                            {r.plateNumber}
                          </div>
                          {(r.vehicleMake || r.vehicleColor) && (
                            <div className="text-xs text-zinc-500">
                              {[r.vehicleMake, r.vehicleModel, r.vehicleColor]
                                .filter(Boolean)
                                .join(" · ")}
                            </div>
                          )}
                        </TableCell>
                        <TableCell>
                          <RiderStatusBadge status={r.status} />
                        </TableCell>
                        <TableCell>
                          <div className="text-sm">
                            <span className="font-medium text-zinc-900">
                              {r.activeDeliveries}
                            </span>
                            <span className="text-zinc-500"> active</span>
                          </div>
                          <div className="text-xs text-zinc-500">
                            {r.totalDeliveries} total
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setViewing(r)}
                            >
                              View
                            </Button>
                            {can("edit") && (
                              <>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => toggleStatus(r)}
                                >
                                  {r.status === "active" ? "Deactivate" : "Activate"}
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => setEditing({ ...r })}
                                >
                                  Edit
                                </Button>
                              </>
                            )}
                            {can("delete") && (
                              <Button
                                variant="ghost"
                                size="sm"
                                className="text-red-600 hover:text-red-700"
                                onClick={() => setToDelete(r.id)}
                              >
                                Remove
                              </Button>
                            )}
                          </div>
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

      {/* Edit / Create dialog */}
      <Dialog open={!!editing} onOpenChange={(o) => !o && setEditing(null)}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editing?.id ? "Edit rider" : "Add rider"}
            </DialogTitle>
          </DialogHeader>
          {editing && (
            <div className="space-y-4 py-2">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label>First name</Label>
                  <Input
                    value={editing.firstName}
                    onChange={(e) =>
                      setEditing({ ...editing, firstName: e.target.value })
                    }
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>Last name</Label>
                  <Input
                    value={editing.lastName}
                    onChange={(e) =>
                      setEditing({ ...editing, lastName: e.target.value })
                    }
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label>Phone</Label>
                  <Input
                    value={editing.phone}
                    onChange={(e) =>
                      setEditing({ ...editing, phone: e.target.value })
                    }
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>WhatsApp</Label>
                  <Input
                    value={editing.whatsapp ?? ""}
                    onChange={(e) =>
                      setEditing({
                        ...editing,
                        whatsapp: e.target.value || null,
                      })
                    }
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label>Email</Label>
                <Input
                  type="email"
                  value={editing.email ?? ""}
                  onChange={(e) =>
                    setEditing({ ...editing, email: e.target.value || null })
                  }
                />
              </div>

              <div className="space-y-1.5">
                <Label>Coverage zone (Accra)</Label>
                <Input
                  placeholder="e.g. East Legon, Airport, Cantonments"
                  value={editing.zone}
                  onChange={(e) =>
                    setEditing({ ...editing, zone: e.target.value })
                  }
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label>Status</Label>
                  <Select
                    value={editing.status}
                    onValueChange={(v) =>
                      setEditing({ ...editing, status: v as RiderStatus })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="inactive">Inactive</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label>Vehicle type</Label>
                  <Select
                    value={editing.vehicleType}
                    onValueChange={(v) =>
                      setEditing({
                        ...editing,
                        vehicleType: v as VehicleType,
                      })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="motorcycle">Motorcycle</SelectItem>
                      <SelectItem value="bicycle">Bicycle</SelectItem>
                      <SelectItem value="car">Car</SelectItem>
                      <SelectItem value="van">Van</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-1.5">
                <Label>Plate number</Label>
                <Input
                  className="font-mono"
                  placeholder="GR 4521-21"
                  value={editing.plateNumber}
                  onChange={(e) =>
                    setEditing({ ...editing, plateNumber: e.target.value })
                  }
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div className="space-y-1.5">
                  <Label>Make</Label>
                  <Input
                    value={editing.vehicleMake ?? ""}
                    onChange={(e) =>
                      setEditing({
                        ...editing,
                        vehicleMake: e.target.value || null,
                      })
                    }
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>Model</Label>
                  <Input
                    value={editing.vehicleModel ?? ""}
                    onChange={(e) =>
                      setEditing({
                        ...editing,
                        vehicleModel: e.target.value || null,
                      })
                    }
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>Color</Label>
                  <Input
                    value={editing.vehicleColor ?? ""}
                    onChange={(e) =>
                      setEditing({
                        ...editing,
                        vehicleColor: e.target.value || null,
                      })
                    }
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label>License number</Label>
                <Input
                  className="font-mono"
                  value={editing.licenseNumber ?? ""}
                  onChange={(e) =>
                    setEditing({
                      ...editing,
                      licenseNumber: e.target.value || null,
                    })
                  }
                />
              </div>

              <div className="space-y-1.5">
                <Label>Notes</Label>
                <Textarea
                  rows={3}
                  value={editing.notes}
                  onChange={(e) =>
                    setEditing({ ...editing, notes: e.target.value })
                  }
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditing(null)}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={upsert.isPending}>
              {upsert.isPending ? "Saving..." : "Save"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* View detail dialog */}
      <Dialog open={!!viewing} onOpenChange={(o) => !o && setViewing(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {viewing?.firstName} {viewing?.lastName}
            </DialogTitle>
          </DialogHeader>
          {viewing && (
            <div className="space-y-4 text-sm">
              <div className="flex items-center gap-2">
                <RiderStatusBadge status={viewing.status} />
                <span className="text-zinc-500">
                  {viewing.activeDeliveries} active · {viewing.totalDeliveries}{" "}
                  total deliveries
                </span>
              </div>

              <DetailRow icon={Phone} label="Phone" value={viewing.phone} />
              {viewing.whatsapp && (
                <DetailRow
                  icon={Phone}
                  label="WhatsApp"
                  value={viewing.whatsapp}
                />
              )}
              {viewing.email && (
                <DetailRow icon={Mail} label="Email" value={viewing.email} />
              )}
              {viewing.zone && (
                <DetailRow
                  icon={Bike}
                  label="Coverage zone"
                  value={viewing.zone}
                />
              )}

              <div className="border-t border-zinc-100 pt-4">
                <div className="flex items-center gap-2 font-medium text-zinc-900 mb-2">
                  <Car className="h-4 w-4" />
                  Vehicle
                </div>
                <dl className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm pl-6">
                  <dt className="text-zinc-500">Type</dt>
                  <dd>{VEHICLE_LABELS[viewing.vehicleType]}</dd>
                  <dt className="text-zinc-500">Plate</dt>
                  <dd className="font-mono">{viewing.plateNumber}</dd>
                  {viewing.vehicleMake && (
                    <>
                      <dt className="text-zinc-500">Make / Model</dt>
                      <dd>
                        {viewing.vehicleMake}
                        {viewing.vehicleModel
                          ? ` ${viewing.vehicleModel}`
                          : ""}
                      </dd>
                    </>
                  )}
                  {viewing.vehicleColor && (
                    <>
                      <dt className="text-zinc-500">Color</dt>
                      <dd>{viewing.vehicleColor}</dd>
                    </>
                  )}
                  {viewing.licenseNumber && (
                    <>
                      <dt className="text-zinc-500">License</dt>
                      <dd className="font-mono">{viewing.licenseNumber}</dd>
                    </>
                  )}
                </dl>
              </div>

              {viewing.notes && (
                <div className="border-t border-zinc-100 pt-4">
                  <p className="text-xs uppercase tracking-widest text-zinc-400 mb-1">
                    Notes
                  </p>
                  <p className="text-zinc-600">{viewing.notes}</p>
                </div>
              )}

              <p className="text-xs text-zinc-400">
                Joined {fmtDate(viewing.joinedAt)}
              </p>
            </div>
          )}
          <DialogFooter>
            {can("edit") && viewing && (
              <Button
                variant="outline"
                onClick={() => {
                  setEditing({ ...viewing });
                  setViewing(null);
                }}
              >
                Edit
              </Button>
            )}
            <Button onClick={() => setViewing(null)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={!!toDelete}
        onOpenChange={(o) => !o && setToDelete(null)}
        title="Remove rider?"
        description="This removes the rider from your records. Active deliveries should be reassigned first."
        confirmText="Remove"
        onConfirm={handleDelete}
      />
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
  tone?: "emerald" | "blue" | "zinc" | "rose";
}) {
  const colors = {
    emerald: "text-emerald-600",
    blue: "text-blue-600",
    zinc: "text-zinc-600",
    rose: "text-rose-600",
  };
  return (
    <Card>
      <CardContent className="p-4">
        <p className="text-xs text-zinc-500 uppercase tracking-wider">{label}</p>
        <p
          className={`text-2xl font-semibold mt-1 ${tone ? colors[tone] : "text-zinc-900"}`}
        >
          {value}
        </p>
      </CardContent>
    </Card>
  );
}

function DetailRow({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-start gap-2">
      <Icon className="h-4 w-4 text-zinc-400 mt-0.5 shrink-0" />
      <div>
        <p className="text-xs text-zinc-400">{label}</p>
        <p className="text-zinc-900">{value}</p>
      </div>
    </div>
  );
}
