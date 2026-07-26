"use client";

import * as React from "react";
import Image from "next/image";
import { ImagePlus, Link as LinkIcon, Upload } from "lucide-react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { PUBLIC_IMAGES } from "@/lib/data/public-images";

export function ImagePicker({
  onSelect,
  onSelectFile,
  /**
   * When true (product form), picking a file only returns the File to the
   * parent — it is inlined into product.create JSON on Save. When false
   * (e.g. collections), callers handle upload/URL themselves.
   */
  deferUpload = false,
  trigger,
}: {
  onSelect: (url: string) => void;
  onSelectFile?: (file: File) => void;
  deferUpload?: boolean;
  trigger?: React.ReactNode;
}) {
  const [open, setOpen] = React.useState(false);
  const [url, setUrl] = React.useState("");

  const pickUrl = (u: string) => {
    if (!u) return;
    onSelect(u);
    setOpen(false);
    setUrl("");
  };

  const handleFile = (file: File | undefined) => {
    if (!file) return;
    console.log("[image-picker] file selected (local only)", {
      name: file.name,
      size: file.size,
      type: file.type || "(empty)",
      deferUpload,
    });

    if (!file.type.startsWith("image/")) {
      toast.error("Choose an image file.");
      return;
    }

    if (deferUpload) {
      if (!onSelectFile) {
        toast.error("File selection is not wired for this form.");
        return;
      }
      onSelectFile(file);
      setOpen(false);
      return;
    }

    // Non-deferred callers: expose a local object URL (they own upload timing).
    if (onSelectFile) {
      onSelectFile(file);
      setOpen(false);
      return;
    }

    const objectUrl = URL.createObjectURL(file);
    pickUrl(objectUrl);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger ?? (
          <button
            type="button"
            className="h-16 w-16 rounded border border-dashed border-zinc-300 text-zinc-500 hover:text-zinc-900 hover:border-zinc-500 flex items-center justify-center"
          >
            <ImagePlus className="h-5 w-5" />
          </button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-3xl max-h-[80vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>Choose an image</DialogTitle>
        </DialogHeader>
        <Tabs
          defaultValue="library"
          className="flex-1 overflow-hidden flex flex-col"
        >
          <TabsList className="self-start">
            <TabsTrigger value="library">From library</TabsTrigger>
            <TabsTrigger value="upload">Upload</TabsTrigger>
            <TabsTrigger value="url">Paste URL</TabsTrigger>
          </TabsList>

          <TabsContent
            value="library"
            className="mt-4 overflow-y-auto pr-1 space-y-6"
          >
            {PUBLIC_IMAGES.map((group) => (
              <div key={group.group}>
                <div className="text-xs font-semibold uppercase tracking-wider text-zinc-500 mb-2">
                  {group.group}
                </div>
                <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
                  {group.items.map((src) => (
                    <button
                      type="button"
                      key={src}
                      onClick={() => pickUrl(src)}
                      className="relative aspect-square rounded overflow-hidden bg-zinc-100 hover:ring-2 hover:ring-zinc-900 transition"
                    >
                      <Image
                        src={src}
                        alt=""
                        fill
                        sizes="120px"
                        className="object-cover"
                      />
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </TabsContent>

          <TabsContent value="upload" className="mt-4 space-y-3">
            <label className="flex flex-col items-center justify-center gap-2 h-40 rounded border border-dashed border-zinc-300 text-zinc-500 hover:text-zinc-900 hover:border-zinc-500 cursor-pointer">
              <Upload className="h-6 w-6" />
              <span className="text-sm text-center px-4">
                {deferUpload
                  ? "Select an image — it is sent when you save the product"
                  : "Click to select an image"}
              </span>
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp"
                className="hidden"
                onChange={(e) => {
                  handleFile(e.target.files?.[0]);
                  e.target.value = "";
                }}
              />
            </label>
          </TabsContent>

          <TabsContent value="url" className="mt-4 space-y-3">
            <div className="flex items-center gap-2">
              <LinkIcon className="h-4 w-4 text-zinc-400" />
              <Input
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="https://..."
              />
            </div>
            {url && (
              <div className="relative aspect-video bg-zinc-100 rounded overflow-hidden">
                <Image src={url} alt="" fill className="object-contain" />
              </div>
            )}
            <DialogFooter>
              <Button onClick={() => pickUrl(url)}>Use this URL</Button>
            </DialogFooter>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
