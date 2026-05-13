"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { toast } from "sonner";
import { PlusCircle, GripVertical, Trash2 } from "lucide-react";
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
  arrayMove,
} from "@dnd-kit/sortable";
import { KeyboardSensor } from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
import { useBanners, useDeleteBanner, useUpdateBanner, useReorderBanners } from "@/lib/hooks";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatDate } from "@/lib/utils";
import type { Banner } from "@/types";

function SortableBannerRow({ banner, onDelete, onToggle }: { banner: Banner; onDelete: () => void; onToggle: () => void }) {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: banner.id });
  const style = { transform: CSS.Transform.toString(transform), transition };

  return (
    <div ref={setNodeRef} style={style} className="flex items-center gap-4 p-4 bg-white border border-zinc-100 rounded-lg">
      <button {...attributes} {...listeners} className="text-zinc-300 hover:text-zinc-500 cursor-grab active:cursor-grabbing">
        <GripVertical className="h-5 w-5" />
      </button>
      <div className="relative h-12 w-20 rounded overflow-hidden shrink-0">
        <Image src={banner.imageUrl} alt={banner.title} fill className="object-cover" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-medium text-zinc-900 truncate">{banner.title}</p>
        <p className="text-xs text-zinc-500">{banner.subtitle ?? ""}</p>
      </div>
      <Badge variant="default">{banner.position.replace(/_/g, " ")}</Badge>
      <div className="text-xs text-zinc-400 whitespace-nowrap">
        {banner.startsAt ? formatDate(banner.startsAt) : "Now"} - {banner.endsAt ? formatDate(banner.endsAt) : "No end"}
      </div>
      <Switch checked={banner.active} onCheckedChange={onToggle} />
      <Link href={`/dashboard/banners/${banner.id}`}>
        <Button variant="ghost" size="sm">Edit</Button>
      </Link>
      <button onClick={onDelete} className="text-red-400 hover:text-red-600">
        <Trash2 className="h-4 w-4" />
      </button>
    </div>
  );
}

export default function BannersPage() {
  const { data: banners = [], isLoading } = useBanners();
  const deleteBanner = useDeleteBanner();
  const updateBanner = useUpdateBanner();
  const reorderBanners = useReorderBanners();
  const [deleteTarget, setDeleteTarget] = useState<Banner | null>(null);
  const [localBanners, setLocalBanners] = useState<Banner[]>([]);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const displayBanners = localBanners.length ? localBanners : banners;

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const base = localBanners.length ? localBanners : banners;
    const oldIndex = base.findIndex((b) => b.id === active.id);
    const newIndex = base.findIndex((b) => b.id === over.id);
    const reordered = arrayMove(base, oldIndex, newIndex);
    setLocalBanners(reordered);
    reorderBanners.mutate(
      reordered.map((b) => b.id),
      { onSuccess: () => toast.success("Order saved") },
    );
  };

  const handleDelete = () => {
    if (!deleteTarget) return;
    deleteBanner.mutate(deleteTarget.id, {
      onSuccess: () => { toast.success("Deleted"); setDeleteTarget(null); },
      onError: () => toast.error("Failed to delete"),
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-zinc-900">Banners</h1>
        <Link href="/dashboard/banners/new">
          <Button><PlusCircle className="h-4 w-4 mr-2" />New Banner</Button>
        </Link>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-16 bg-white border border-zinc-100 rounded-lg animate-pulse" />
          ))}
        </div>
      ) : (
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext items={displayBanners.map((b) => b.id)} strategy={verticalListSortingStrategy}>
            <div className="space-y-3">
              {displayBanners.map((banner) => (
                <SortableBannerRow
                  key={banner.id}
                  banner={banner}
                  onDelete={() => setDeleteTarget(banner)}
                  onToggle={() =>
                    updateBanner.mutate(
                      { id: banner.id, body: { active: !banner.active } },
                      { onSuccess: () => toast.success("Updated") },
                    )
                  }
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>
      )}

      <ConfirmDialog
        open={!!deleteTarget}
        onOpenChange={(o) => !o && setDeleteTarget(null)}
        title="Delete Banner"
        description={`Delete "${deleteTarget?.title}"? This cannot be undone.`}
        onConfirm={handleDelete}
        confirmLabel="Delete"
        destructive
        loading={deleteBanner.isPending}
      />
    </div>
  );
}
