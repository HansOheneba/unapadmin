"use client";

import * as React from "react";
import Image from "next/image";
import { ImagePlus, Link as LinkIcon } from "lucide-react";
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
  trigger,
}: {
  onSelect: (url: string) => void;
  trigger?: React.ReactNode;
}) {
  const [open, setOpen] = React.useState(false);
  const [url, setUrl] = React.useState("");

  const pick = (u: string) => {
    if (!u) return;
    onSelect(u);
    setOpen(false);
    setUrl("");
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
        <Tabs defaultValue="library" className="flex-1 overflow-hidden flex flex-col">
          <TabsList className="self-start">
            <TabsTrigger value="library">From library</TabsTrigger>
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
                      onClick={() => pick(src)}
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
              <Button onClick={() => pick(url)}>Use this URL</Button>
            </DialogFooter>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
