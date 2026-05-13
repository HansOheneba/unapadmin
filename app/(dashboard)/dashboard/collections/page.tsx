"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Plus, GripVertical, Trash2 } from "lucide-react";
import { toast } from "sonner";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  rectSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
  useCollections,
  useDeleteCollection,
  useReorderCollections,
} from "@/lib/hooks/useCollections";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { Button } from "@/components/ui/button";
import type { Collection } from "@/types";

function CollectionCard({
  collection,
  onDelete,
}: {
  collection: Collection;
  onDelete: (id: string) => void;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: collection.id,
  });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="bg-white border border-zinc-100 rounded-lg overflow-hidden"
    >
      <div className="relative aspect-video">
        <Image
          src={collection.featured}
          alt={collection.title}
          fill
          className="object-cover"
          sizes="300px"
          onError={() => {}}
        />
        <button
          {...attributes}
          {...listeners}
          className="absolute top-2 left-2 p-1 bg-white/80 rounded cursor-grab active:cursor-grabbing"
        >
          <GripVertical className="h-4 w-4 text-zinc-500" />
        </button>
      </div>
      <div className="p-4">
        <p className="text-xs text-zinc-500 uppercase tracking-wide">
          {collection.subtitle}
        </p>
        <h3 className="font-semibold text-zinc-900 mt-0.5">
          {collection.title}
        </h3>
        <p className="text-xs text-zinc-400 mt-1">
          {collection.productCount} products
        </p>
        <div className="mt-3 flex items-center gap-2">
          <Link
            href={`/dashboard/collections/${collection.id}`}
            className="flex-1"
          >
            <Button variant="outline" size="sm" className="w-full">
              Edit
            </Button>
          </Link>
          <Button
            variant="ghost"
            size="icon"
            className="text-red-500 hover:text-red-600 hover:bg-red-50"
            onClick={() => onDelete(collection.id)}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}

export default function CollectionsPage() {
  const { data: collections = [], isLoading } = useCollections();
  const deleteCollection = useDeleteCollection();
  const reorderCollections = useReorderCollections();
  const [items, setItems] = useState<string[]>([]);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const sorted = [...collections].sort((a, b) => a.sortOrder - b.sortOrder);
  const ids = items.length > 0 ? items : sorted.map((c) => c.id);
  const orderedCollections = ids
    .map((id) => sorted.find((c) => c.id === id)!)
    .filter(Boolean);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      const oldIndex = ids.indexOf(active.id as string);
      const newIndex = ids.indexOf(over.id as string);
      const newIds = arrayMove(ids, oldIndex, newIndex);
      setItems(newIds);
      reorderCollections.mutate(newIds, {
        onSuccess: () => toast.success("Order saved"),
        onError: () => toast.error("Failed to save order"),
      });
    }
  };

  const handleDelete = () => {
    if (!deleteId) return;
    deleteCollection.mutate(deleteId, {
      onSuccess: () => {
        toast.success("Collection deleted");
        setDeleteId(null);
      },
      onError: () => toast.error("Failed to delete collection"),
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-zinc-900">Collections</h1>
        <Link href="/dashboard/collections/new">
          <Button>
            <Plus className="h-4 w-4 mr-1" />
            New Collection
          </Button>
        </Link>
      </div>

      <p className="text-sm text-zinc-500">
        Drag to reorder. Order controls hero alternation on the storefront. Even
        position = hero text left. Odd = right.
      </p>

      {isLoading ? (
        <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              className="h-64 bg-white border border-zinc-100 rounded-lg animate-pulse"
            />
          ))}
        </div>
      ) : (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext items={ids} strategy={rectSortingStrategy}>
            <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
              {orderedCollections.map((collection) => (
                <CollectionCard
                  key={collection.id}
                  collection={collection}
                  onDelete={setDeleteId}
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>
      )}

      <ConfirmDialog
        open={!!deleteId}
        onOpenChange={(o) => !o && setDeleteId(null)}
        title="Delete Collection"
        description="This will permanently delete the collection. Products in this collection will not be deleted."
        onConfirm={handleDelete}
        confirmLabel="Delete"
        destructive
        loading={deleteCollection.isPending}
      />
    </div>
  );
}
