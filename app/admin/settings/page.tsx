"use client";

import * as React from "react";
import { Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import {
  useAdminUsers,
  useSettings,
  useSettingsMutations,
} from "@/lib/hooks/useSettings";
import { EMPTY_SETTINGS, normalizeSettings } from "@/lib/api/settings";
import { useAuth } from "@/lib/hooks/useAuth";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { fmtDate } from "@/lib/format";
import { useMockApi } from "@/lib/api/client";
import { resetMockStore } from "@/lib/mock/data-store";
import { useQueryClient } from "@tanstack/react-query";
import type { AdminRole, StoreSettings } from "@/types";

export default function SettingsPage() {
  const router = useRouter();
  const { isSuperAdmin, currentUser } = useAuth();
  const {
    data: settings,
    isLoading: settingsLoading,
    isError: settingsError,
    error: settingsErrorObj,
    refetch: refetchSettings,
  } = useSettings();
  const {
    data: admins = [],
    isLoading: adminsLoading,
    isError: adminsError,
    error: adminsErrorObj,
    refetch: refetchAdmins,
  } = useAdminUsers();
  const { update, invite, removeAdmin, updateRole } = useSettingsMutations();
  const qc = useQueryClient();
  const mockApi = useMockApi();

  const [prevAuth, setPrevAuth] = React.useState(isSuperAdmin);
  if (prevAuth !== isSuperAdmin) {
    setPrevAuth(isSuperAdmin);
    if (!isSuperAdmin) router.replace("/admin");
  }

  // Always controlled — never mount inputs against null/undefined field values.
  const [draft, setDraft] = React.useState<StoreSettings>(EMPTY_SETTINGS);
  const [inviteOpen, setInviteOpen] = React.useState(false);
  const [inviteName, setInviteName] = React.useState("");
  const [inviteEmail, setInviteEmail] = React.useState("");
  const [inviteRole, setInviteRole] = React.useState<AdminRole>("admin");
  const [toRemove, setToRemove] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (settings) setDraft(normalizeSettings(settings));
  }, [settings]);

  if (!isSuperAdmin) return null;

  const loadFailed =
    settingsError || adminsError || (!settingsLoading && !settings);

  if (loadFailed) {
    const message =
      (settingsErrorObj instanceof Error && settingsErrorObj.message) ||
      (adminsErrorObj instanceof Error && adminsErrorObj.message) ||
      "Failed to load settings.";
    return (
      <div className="py-12 text-center space-y-3">
        <p className="text-sm text-rose-600">{message}</p>
        <Button
          variant="outline"
          onClick={() => {
            refetchSettings();
            refetchAdmins();
          }}
        >
          Retry
        </Button>
      </div>
    );
  }

  if (settingsLoading || adminsLoading || !settings) {
    return (
      <div className="py-12 text-center text-sm text-zinc-500">
        Loading settings...
      </div>
    );
  }

  const save = async () => {
    try {
      await update.mutateAsync(draft);
      toast.success("Settings saved.");
    } catch (e) {
      toast.error(
        e instanceof Error ? e.message : "Failed to save settings.",
      );
    }
  };

  const u = <K extends keyof StoreSettings>(k: K, v: StoreSettings[K]) =>
    setDraft((d) => ({ ...d, [k]: v }));

  const orderEmail = draft.adminEmailForOrders ?? "";
  const lowStockEmail = draft.adminEmailForLowStock ?? "";
  const threshold =
    draft.lowStockThreshold == null || Number.isNaN(draft.lowStockThreshold)
      ? ""
      : String(draft.lowStockThreshold);

  return (
    <div className="space-y-6">
      <div className="flex items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-zinc-900">Settings</h1>
          <p className="text-sm text-zinc-500 mt-1">
            Notification emails, low stock threshold, and admin access.
          </p>
        </div>
        <Button onClick={save} disabled={update.isPending}>
          Save changes
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base font-semibold">
            Notifications
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div>
            <Label>Order notifications email</Label>
            <Input
              value={orderEmail}
              onChange={(e) => u("adminEmailForOrders", e.target.value)}
            />
          </div>
          <div>
            <Label>Low stock alerts email</Label>
            <Input
              value={lowStockEmail}
              onChange={(e) => u("adminEmailForLowStock", e.target.value)}
            />
          </div>
          <div>
            <Label>Low stock threshold</Label>
            <Input
              type="number"
              value={threshold}
              onChange={(e) => {
                const next = e.target.value;
                u(
                  "lowStockThreshold",
                  next === "" ? 0 : Number(next),
                );
              }}
            />
            <p className="text-xs text-zinc-500 mt-1">
              Alert when a size variant stock falls at or below this number.
            </p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-base font-semibold">
            Admin users ({admins.length})
          </CardTitle>
          <Button size="sm" onClick={() => setInviteOpen(true)}>
            <Plus className="h-4 w-4" />
            Invite admin
          </Button>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Created</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {admins.map((a) => {
                const isSelf = a.id === currentUser?.id;
                const otherSuperAdmins = admins.filter(
                  (x) => x.role === "super_admin" && x.id !== a.id,
                ).length;
                const isLastSuperAdmin =
                  a.role === "super_admin" && otherSuperAdmins === 0;

                return (
                  <TableRow key={a.id}>
                    <TableCell className="font-medium text-zinc-900">
                      {a.name}
                      {isSelf && (
                        <span className="ml-1.5 text-xs text-zinc-400">
                          (you)
                        </span>
                      )}
                    </TableCell>
                    <TableCell className="text-sm text-zinc-700">
                      {a.email}
                    </TableCell>
                    <TableCell>
                      <Select
                        value={a.role ?? "viewer"}
                        disabled={isLastSuperAdmin || updateRole.isPending}
                        onValueChange={async (v) => {
                          try {
                            await updateRole.mutateAsync({
                              id: a.id,
                              role: v as AdminRole,
                            });
                            toast.success("Role updated.");
                          } catch (e) {
                            toast.error(
                              e instanceof Error
                                ? e.message
                                : "Failed to update role.",
                            );
                          }
                        }}
                      >
                        <SelectTrigger className="h-8 w-36">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="super_admin">
                            Super admin
                          </SelectItem>
                          <SelectItem value="admin">Admin</SelectItem>
                          <SelectItem value="viewer">Viewer</SelectItem>
                        </SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell className="text-xs text-zinc-500">
                      {fmtDate(a.createdAt)}
                    </TableCell>
                    <TableCell className="text-right">
                      {!isSelf && !isLastSuperAdmin && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-rose-600"
                          onClick={() => setToRemove(a.id)}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={inviteOpen} onOpenChange={setInviteOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Invite an admin</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <Label>Full name</Label>
              <Input
                value={inviteName ?? ""}
                onChange={(e) => setInviteName(e.target.value)}
              />
            </div>
            <div>
              <Label>Email</Label>
              <Input
                type="email"
                value={inviteEmail ?? ""}
                onChange={(e) => setInviteEmail(e.target.value)}
              />
            </div>
            <div>
              <Label>Role</Label>
              <Select
                value={inviteRole}
                onValueChange={(v) => setInviteRole(v as AdminRole)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="admin">Admin</SelectItem>
                  <SelectItem value="viewer">Viewer</SelectItem>
                  <SelectItem value="super_admin">Super admin</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setInviteOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={async () => {
                if (!inviteName || !inviteEmail) {
                  toast.error("Name and email are required.");
                  return;
                }
                try {
                  await invite.mutateAsync({
                    name: inviteName,
                    email: inviteEmail,
                    role: inviteRole,
                  });
                  toast.success("Admin invited.");
                  setInviteName("");
                  setInviteEmail("");
                  setInviteRole("admin");
                  setInviteOpen(false);
                } catch (e) {
                  toast.error(
                    e instanceof Error ? e.message : "Failed to invite admin.",
                  );
                }
              }}
            >
              Send invite
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {mockApi && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base font-semibold">
              Demo data
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm text-zinc-600 max-w-lg">
              Changes are saved in your browser (localStorage) while the backend
              is offline. Reset to restore the original seed data.
            </p>
            <Button
              variant="outline"
              onClick={async () => {
                resetMockStore();
                await qc.invalidateQueries();
                toast.success("Demo data reset to defaults.");
              }}
            >
              Reset demo data
            </Button>
          </CardContent>
        </Card>
      )}

      <ConfirmDialog
        open={!!toRemove}
        onOpenChange={(o) => !o && setToRemove(null)}
        title="Remove admin?"
        description="They will immediately lose access to the admin dashboard."
        destructive
        confirmText="Remove access"
        onConfirm={async () => {
          if (!toRemove) return;
          try {
            await removeAdmin.mutateAsync(toRemove);
            toast.success("Admin removed.");
            setToRemove(null);
          } catch (e) {
            toast.error(
              e instanceof Error ? e.message : "Failed to remove admin.",
            );
          }
        }}
      />
    </div>
  );
}
