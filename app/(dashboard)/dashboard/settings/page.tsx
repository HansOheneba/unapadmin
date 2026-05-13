"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { toast } from "sonner";
import { Trash2, PlusCircle } from "lucide-react";
import {
  useSettings,
  useUpdateSettings,
  useAdminUsers,
  useCreateAdminUser,
  useDeleteAdminUser,
} from "@/lib/hooks";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
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
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatDate } from "@/lib/utils";
import { can } from "@/lib/permissions";
import type { AdminRole } from "@/types";

export default function SettingsPage() {
  const { data: session } = useSession();
  const role = (session?.user as { role?: AdminRole })?.role ?? "VIEWER";
  const isSuperAdmin = can(role, "manage_settings");

  const { data: settings, isLoading: settingsLoading } = useSettings();
  const updateSettings = useUpdateSettings();
  const { data: admins = [], isLoading: adminsLoading } = useAdminUsers();
  const createAdmin = useCreateAdminUser();
  const deleteAdmin = useDeleteAdminUser();

  const [settingsForm, setSettingsForm] = useState({
    storeName: "",
    contactEmail: "",
    currency: "",
    defaultCountry: "",
  });
  const [inviteForm, setInviteForm] = useState({
    name: "",
    email: "",
    role: "EDITOR" as AdminRole,
  });
  const [showInvite, setShowInvite] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);

  useEffect(() => {
    if (settings) setSettingsForm(settings);
  }, [settings]);

  const handleSettingsSave = (e: React.FormEvent) => {
    e.preventDefault();
    updateSettings.mutate(settingsForm, {
      onSuccess: () => toast.success("Settings saved"),
      onError: () => toast.error("Failed to save settings"),
    });
  };

  const handleInvite = (e: React.FormEvent) => {
    e.preventDefault();
    createAdmin.mutate(inviteForm, {
      onSuccess: () => {
        toast.success("Admin user created");
        setShowInvite(false);
        setInviteForm({ name: "", email: "", role: "EDITOR" });
      },
      onError: () => toast.error("Failed to create admin user"),
    });
  };

  const handleDelete = () => {
    if (!deleteTarget) return;
    deleteAdmin.mutate(deleteTarget, {
      onSuccess: () => {
        toast.success("Admin user removed");
        setDeleteTarget(null);
      },
      onError: () => toast.error("Failed to remove user"),
    });
  };

  return (
    <div className="space-y-8 max-w-2xl">
      <h1 className="text-2xl font-semibold text-zinc-900">Settings</h1>

      {/* Store info */}
      <div className="bg-white border border-zinc-100 rounded-lg p-6 space-y-4">
        <h2 className="font-semibold text-zinc-900">Store Information</h2>
        <form onSubmit={handleSettingsSave} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="storeName">Store Name</Label>
              <Input
                id="storeName"
                value={settingsForm.storeName}
                onChange={(e) =>
                  setSettingsForm({
                    ...settingsForm,
                    storeName: e.target.value,
                  })
                }
                disabled={!isSuperAdmin}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="contactEmail">Contact Email</Label>
              <Input
                id="contactEmail"
                type="email"
                value={settingsForm.contactEmail}
                onChange={(e) =>
                  setSettingsForm({
                    ...settingsForm,
                    contactEmail: e.target.value,
                  })
                }
                disabled={!isSuperAdmin}
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="currency">Currency</Label>
              <Input
                id="currency"
                value={settingsForm.currency}
                onChange={(e) =>
                  setSettingsForm({ ...settingsForm, currency: e.target.value })
                }
                placeholder="USD"
                disabled={!isSuperAdmin}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="country">Default Country</Label>
              <Input
                id="country"
                value={settingsForm.defaultCountry}
                onChange={(e) =>
                  setSettingsForm({
                    ...settingsForm,
                    defaultCountry: e.target.value,
                  })
                }
                placeholder="GH"
                disabled={!isSuperAdmin}
              />
            </div>
          </div>
          {isSuperAdmin && (
            <Button type="submit" disabled={updateSettings.isPending}>
              {updateSettings.isPending ? "Saving..." : "Save Settings"}
            </Button>
          )}
        </form>
      </div>

      {/* Admin users - SUPER_ADMIN only */}
      {isSuperAdmin && (
        <div className="bg-white border border-zinc-100 rounded-lg overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-zinc-100">
            <h2 className="font-semibold text-zinc-900">Admin Users</h2>
            <Button size="sm" onClick={() => setShowInvite(!showInvite)}>
              <PlusCircle className="h-4 w-4 mr-2" />
              Invite Admin
            </Button>
          </div>

          {showInvite && (
            <form
              onSubmit={handleInvite}
              className="p-5 border-b border-zinc-100 bg-zinc-50 grid grid-cols-3 gap-4"
            >
              <div className="space-y-1.5">
                <Label htmlFor="inviteName">Name</Label>
                <Input
                  id="inviteName"
                  value={inviteForm.name}
                  onChange={(e) =>
                    setInviteForm({ ...inviteForm, name: e.target.value })
                  }
                  required
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="inviteEmail">Email</Label>
                <Input
                  id="inviteEmail"
                  type="email"
                  value={inviteForm.email}
                  onChange={(e) =>
                    setInviteForm({ ...inviteForm, email: e.target.value })
                  }
                  required
                />
              </div>
              <div className="space-y-1.5">
                <Label>Role</Label>
                <Select
                  value={inviteForm.role}
                  onValueChange={(v) =>
                    setInviteForm({ ...inviteForm, role: v as AdminRole })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="SUPER_ADMIN">Super Admin</SelectItem>
                    <SelectItem value="MANAGER">Manager</SelectItem>
                    <SelectItem value="EDITOR">Editor</SelectItem>
                    <SelectItem value="VIEWER">Viewer</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="col-span-3 flex gap-3">
                <Button type="submit" disabled={createAdmin.isPending}>
                  {createAdmin.isPending ? "Creating..." : "Create User"}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowInvite(false)}
                >
                  Cancel
                </Button>
              </div>
            </form>
          )}

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Joined</TableHead>
                <TableHead className="w-16"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {adminsLoading
                ? Array.from({ length: 3 }).map((_, i) => (
                    <TableRow key={i}>
                      {Array.from({ length: 5 }).map((_, j) => (
                        <TableCell key={j}>
                          <div className="h-4 bg-zinc-100 rounded animate-pulse" />
                        </TableCell>
                      ))}
                    </TableRow>
                  ))
                : admins.map((admin) => (
                    <TableRow key={admin.id}>
                      <TableCell className="font-medium text-zinc-900">
                        {admin.name}
                      </TableCell>
                      <TableCell className="text-zinc-600">
                        {admin.email}
                      </TableCell>
                      <TableCell>
                        <Badge variant="default">{admin.role}</Badge>
                      </TableCell>
                      <TableCell className="text-zinc-500">
                        {formatDate(admin.createdAt)}
                      </TableCell>
                      <TableCell>
                        <button
                          onClick={() => setDeleteTarget(admin.id)}
                          className="text-red-400 hover:text-red-600 transition-colors"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </TableCell>
                    </TableRow>
                  ))}
            </TableBody>
          </Table>
        </div>
      )}

      <ConfirmDialog
        open={!!deleteTarget}
        onOpenChange={(o) => !o && setDeleteTarget(null)}
        title="Remove Admin User"
        description="This will permanently remove this admin user's access."
        onConfirm={handleDelete}
        confirmLabel="Remove"
        destructive
        loading={deleteAdmin.isPending}
      />
    </div>
  );
}
