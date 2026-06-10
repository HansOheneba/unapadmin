"use client";

import * as React from "react";
import { Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import {
  useAdminUsers,
  useSettings,
  useSettingsMutations,
} from "@/lib/hooks/useSettings";
import { useAuth } from "@/lib/hooks/useAuth";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
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
import type { AdminRole, StoreSettings } from "@/types";

export default function SettingsPage() {
  const router = useRouter();
  const { isSuperAdmin } = useAuth();
  const { data: settings, isLoading: settingsLoading } = useSettings();
  const { data: admins = [], isLoading: adminsLoading } = useAdminUsers();
  const { update, invite, removeAdmin } = useSettingsMutations();

  const [prevAuth, setPrevAuth] = React.useState(isSuperAdmin);
  if (prevAuth !== isSuperAdmin) {
    setPrevAuth(isSuperAdmin);
    if (!isSuperAdmin) router.replace("/admin");
  }

  const [draft, setDraft] = React.useState<StoreSettings | null>(null);
  const [inviteOpen, setInviteOpen] = React.useState(false);
  const [inviteName, setInviteName] = React.useState("");
  const [inviteEmail, setInviteEmail] = React.useState("");
  const [inviteRole, setInviteRole] = React.useState<AdminRole>("admin");
  const [toRemove, setToRemove] = React.useState<string | null>(null);

  const [prevSettings, setPrevSettings] = React.useState(settings);
  if (settings && prevSettings !== settings) {
    setPrevSettings(settings);
    setDraft(settings);
  }

  if (!isSuperAdmin) return null;

  if (settingsLoading || adminsLoading || !settings || !draft) {
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
    setDraft((d) => (d ? { ...d, [k]: v } : d));

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
              value={draft.adminEmailForOrders}
              onChange={(e) => u("adminEmailForOrders", e.target.value)}
            />
          </div>
          <div>
            <Label>Low stock alerts email</Label>
            <Input
              value={draft.adminEmailForLowStock}
              onChange={(e) => u("adminEmailForLowStock", e.target.value)}
            />
          </div>
          <div>
            <Label>Low stock threshold</Label>
            <Input
              type="number"
              value={draft.lowStockThreshold}
              onChange={(e) => u("lowStockThreshold", Number(e.target.value))}
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
              {admins.map((a) => (
                <TableRow key={a.id}>
                  <TableCell className="font-medium text-zinc-900">
                    {a.name}
                  </TableCell>
                  <TableCell className="text-sm text-zinc-700">
                    {a.email}
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={
                        a.role === "super_admin"
                          ? "violet"
                          : a.role === "admin"
                            ? "blue"
                            : "zinc"
                      }
                    >
                      {a.role.replace("_", " ")}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-xs text-zinc-500">
                    {fmtDate(a.createdAt)}
                  </TableCell>
                  <TableCell className="text-right">
                    {a.role !== "super_admin" && (
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
              ))}
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
                value={inviteName}
                onChange={(e) => setInviteName(e.target.value)}
              />
            </div>
            <div>
              <Label>Email</Label>
              <Input
                type="email"
                value={inviteEmail}
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
