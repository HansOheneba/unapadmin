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
import { Spinner } from "@/components/ui/spinner";
import { PUBLIC_IMAGES } from "@/lib/data/public-images";
import { uploadImage, validateImageFile, MAX_UPLOAD_LABEL } from "@/lib/api/media";

/**
 * Shared image chooser for products, collections, etc.
 *
 * Upload tab validates size/type on the client first. Oversized files never
 * call `/media/upload`. Valid files are uploaded, and only the returned URL
 * is passed to `onSelect`. Embedded data:/blob: URLs are rejected — product
 * create must only carry short media URLs or Vercel returns 413.
 */
export function ImagePicker({
  onSelect,
  trigger,
}: {
  onSelect: (url: string) => void;
  trigger?: React.ReactNode;
}) {
  const [open, setOpen] = React.useState(false);
  const [url, setUrl] = React.useState("");
  const [uploading, setUploading] = React.useState(false);
  const [fileError, setFileError] = React.useState<string | null>(null);
  const inputRef = React.useRef<HTMLInputElement>(null);

  const pickUrl = (u: string) => {
    const trimmed = u.trim();
    if (!trimmed) return;
    if (
      trimmed.startsWith("data:") ||
      trimmed.startsWith("blob:")
    ) {
      const message =
        "Use Upload or a https image URL. Embedded image data cannot be saved.";
      setFileError(message);
      toast.error(message);
      return;
    }
    onSelect(trimmed);
    setOpen(false);
    setUrl("");
    setFileError(null);
  };

  const handleFile = async (file: File | undefined) => {
    // Always clear the input so the same file can be re-picked after a reject.
    if (inputRef.current) inputRef.current.value = "";
    setFileError(null);
    if (!file) return;

    const sizeMb = file.size / (1024 * 1024);
    console.log("[image-picker] file selected (pre-upload check)", {
      name: file.name,
      size: file.size,
      sizeMb: Number(sizeMb.toFixed(2)),
      type: file.type || "(empty)",
    });

    const validationError = validateImageFile(file);
    if (validationError) {
      console.warn("[image-picker] blocked before upload", {
        name: file.name,
        sizeMb: Number(sizeMb.toFixed(2)),
        reason: validationError,
      });
      setFileError(validationError);
      toast.error(validationError);
      return;
    }

    setUploading(true);
    try {
      const { url: uploadedUrl } = await uploadImage(file);
      console.log("[image-picker] media.upload → url", { url: uploadedUrl });
      pickUrl(uploadedUrl);
    } catch (e) {
      const message = e instanceof Error ? e.message : "Upload failed.";
      setFileError(message);
      toast.error(message);
    } finally {
      setUploading(false);
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (uploading) return;
        setOpen(next);
        if (!next) setFileError(null);
      }}
    >
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
            <TabsTrigger value="library" disabled={uploading}>
              From library
            </TabsTrigger>
            <TabsTrigger value="upload" disabled={uploading}>
              Upload
            </TabsTrigger>
            <TabsTrigger value="url" disabled={uploading}>
              Paste URL
            </TabsTrigger>
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
            <label
              className={`flex flex-col items-center justify-center gap-2 h-40 rounded border border-dashed text-zinc-500 ${
                fileError
                  ? "border-rose-300 bg-rose-50/40"
                  : "border-zinc-300"
              } ${
                uploading
                  ? "opacity-60 cursor-not-allowed"
                  : "hover:text-zinc-900 hover:border-zinc-500 cursor-pointer"
              }`}
            >
              {uploading ? (
                <Spinner className="h-6 w-6" />
              ) : (
                <>
                  <Upload className="h-6 w-6" />
                  <span className="text-sm text-center px-4">
                    Click to upload (JPEG, PNG, or WebP · max {MAX_UPLOAD_LABEL})
                  </span>
                  <span className="text-xs text-zinc-400 px-4 text-center">
                    All file uploads must be less than {MAX_UPLOAD_LABEL}.
                  </span>
                </>
              )}
              <input
                ref={inputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                className="hidden"
                disabled={uploading}
                onChange={(e) => {
                  void handleFile(e.target.files?.[0]);
                }}
              />
            </label>
            {fileError && (
              <p className="text-sm text-rose-600 text-center px-2" role="alert">
                {fileError}
              </p>
            )}
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
