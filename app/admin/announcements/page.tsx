"use client";

import * as React from "react";
import { ArrowDown, ArrowUp, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { useAdminStore } from "@/lib/store";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
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
import type { BannerMessage } from "@/types";

const empty = (): BannerMessage => ({
  id: "",
  text: "",
  href: "/",
  isActive: true,
  startsAt: null,
  endsAt: null,
  sortOrder: 0,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
});

export default function AnnouncementsPage() {
  const config = useAdminStore((s) => s.bannerConfig);
  const messages = useAdminStore((s) => s.bannerMessages);
  const updateConfig = useAdminStore((s) => s.updateBannerConfig);
  const upsert = useAdminStore((s) => s.upsertBannerMessage);
  const remove = useAdminStore((s) => s.deleteBannerMessage);
  const reorder = useAdminStore((s) => s.reorderBannerMessages);

  const [editing, setEditing] = React.useState<BannerMessage | null>(null);
  const [toDelete, setToDelete] = React.useState<string | null>(null);
  const [activeIndex, setActiveIndex] = React.useState(0);

  const sorted = [...messages].sort((a, b) => a.sortOrder - b.sortOrder);
  const activeMessages = sorted.filter((m) => m.isActive);

  React.useEffect(() => {
    if (!config.isEnabled || activeMessages.length <= 1) return;
    const t = setInterval(() => {
      setActiveIndex((i) => (i + 1) % activeMessages.length);
    }, config.rotationIntervalMs);
    return () => clearInterval(t);
  }, [config.isEnabled, config.rotationIntervalMs, activeMessages.length]);

  const move = (idx: number, dir: -1 | 1) => {
    const next = [...sorted];
    const t = idx + dir;
    if (t < 0 || t >= next.length) return;
    [next[idx], next[t]] = [next[t], next[idx]];
    reorder(next.map((m) => m.id));
  };

  return (
    <div className="space-y-6">
      <div className="flex items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-zinc-900">Announcements</h1>
          <p className="text-sm text-zinc-500 mt-1">
            Promo bar shown at the top of every storefront page.
          </p>
        </div>
        <Button onClick={() => setEditing(empty())}>
          <Plus className="h-4 w-4" /> New message
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base font-semibold">Live preview</CardTitle>
        </CardHeader>
        <CardContent>
          {!config.isEnabled || activeMessages.length === 0 ? (
            <div className="rounded border border-dashed border-zinc-200 p-6 text-center text-sm text-zinc-500">
              {!config.isEnabled
                ? "Banner is disabled."
                : "No active messages."}
            </div>
          ) : (
            <div
              className="rounded text-center py-3 px-4 text-sm font-medium transition-colors"
              style={{
                background: config.backgroundColor,
                color: config.textColor,
              }}
            >
              {activeMessages[activeIndex % activeMessages.length].text}
            </div>
          )}
          <p className="mt-2 text-[11px] text-zinc-400">
            Rotates every {(config.rotationIntervalMs / 1000).toFixed(1)}s ·{" "}
            {activeMessages.length} active message(s)
          </p>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="text-base font-semibold">Banner settings</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <Label htmlFor="enabled">Enabled</Label>
              <Switch
                id="enabled"
                checked={config.isEnabled}
                onCheckedChange={(v) => updateConfig({ isEnabled: v })}
              />
            </div>
            <div>
              <Label>Rotation interval (seconds)</Label>
              <Input
                type="number"
                step="0.5"
                value={config.rotationIntervalMs / 1000}
                onChange={(e) =>
                  updateConfig({
                    rotationIntervalMs: Math.max(1, Number(e.target.value)) * 1000,
                  })
                }
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Background</Label>
                <Input
                  type="color"
                  value={config.backgroundColor}
                  onChange={(e) =>
                    updateConfig({ backgroundColor: e.target.value })
                  }
                  className="h-9 p-1"
                />
              </div>
              <div>
                <Label>Text</Label>
                <Input
                  type="color"
                  value={config.textColor}
                  onChange={(e) => updateConfig({ textColor: e.target.value })}
                  className="h-9 p-1"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base font-semibold">
              Messages ({messages.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-20">Order</TableHead>
                  <TableHead>Text</TableHead>
                  <TableHead>Link</TableHead>
                  <TableHead>Active</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sorted.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8 text-zinc-500">
                      No messages yet.
                    </TableCell>
                  </TableRow>
                ) : (
                  sorted.map((m, i) => (
                    <TableRow key={m.id}>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-6 w-6"
                            onClick={() => move(i, -1)}
                            disabled={i === 0}
                          >
                            <ArrowUp className="h-3 w-3" />
                          </Button>
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-6 w-6"
                            onClick={() => move(i, 1)}
                            disabled={i === sorted.length - 1}
                          >
                            <ArrowDown className="h-3 w-3" />
                          </Button>
                        </div>
                      </TableCell>
                      <TableCell className="text-sm">{m.text}</TableCell>
                      <TableCell className="text-xs text-zinc-500 font-mono">
                        {m.href}
                      </TableCell>
                      <TableCell>
                        <Badge variant={m.isActive ? "green" : "zinc"}>
                          {m.isActive ? "Active" : "Off"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setEditing(m)}
                        >
                          Edit
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-rose-600"
                          onClick={() => setToDelete(m.id)}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      {editing && (
        <MessageEditor
          message={editing}
          onClose={() => setEditing(null)}
          onSave={(m) => {
            const id = m.id || `bm_${Date.now().toString(36)}`;
            const sortOrder =
              m.sortOrder ||
              (messages.length === 0
                ? 1
                : Math.max(...messages.map((x) => x.sortOrder)) + 1);
            upsert({ ...m, id, sortOrder });
            toast.success("Message saved.");
            setEditing(null);
          }}
        />
      )}

      <ConfirmDialog
        open={!!toDelete}
        onOpenChange={(o) => !o && setToDelete(null)}
        title="Delete message?"
        destructive
        confirmText="Delete"
        onConfirm={() => {
          if (toDelete) {
            remove(toDelete);
            toast.success("Message deleted.");
            setToDelete(null);
          }
        }}
      />
    </div>
  );
}

function MessageEditor({
  message,
  onClose,
  onSave,
}: {
  message: BannerMessage;
  onClose: () => void;
  onSave: (m: BannerMessage) => void;
}) {
  const [d, setD] = React.useState(message);
  const u = <K extends keyof BannerMessage>(k: K, v: BannerMessage[K]) =>
    setD((x) => ({ ...x, [k]: v }));

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{message.id ? "Edit message" : "New message"}</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div>
            <Label>Text</Label>
            <Input
              value={d.text}
              onChange={(e) => u("text", e.target.value)}
              placeholder="Free shipping on orders over GHS 500"
            />
          </div>
          <div>
            <Label>Link</Label>
            <Input
              value={d.href}
              onChange={(e) => u("href", e.target.value)}
              placeholder="/collections"
            />
          </div>
          <div className="flex items-center justify-between">
            <Label htmlFor="active">Active</Label>
            <Switch
              id="active"
              checked={d.isActive}
              onCheckedChange={(v) => u("isActive", v)}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={() => onSave(d)}>Save</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
