"use client";

import { useState } from "react";
import Image from "next/image";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";

const LIBRARY_IMAGES = [
  "/collections/boxers/boxersWhite.jpeg",
  "/collections/boxers/boxersBlue.jpg",
  "/collections/boxers/boxersBrown.jpeg",
  "/collections/boxers/boxersGray.jpg",
  "/collections/boxers/boxersCream.jpeg",
  "/collections/glases/outlawGlasses1.jpg",
  "/collections/glases/outlawGlasses3.jpg",
  "/collections/glases/shadesFemale.jpg",
  "/collections/headwear/boldSocietyCapBlack.jpg",
  "/collections/headwear/boldSocietyCapCream.jpg",
  "/collections/headwear/boldSocietyCapRed.jpg",
  "/collections/headwear/suedeCapBlack.jpg",
  "/collections/headwear/beanie.jpg",
  "/collections/headwear/beanieRed.jpg",
  "/collections/hoodies/hoodieBlackMan.jpg",
  "/collections/hoodies/hoodieColors.jpg",
  "/collections/female_shirts/shirtBrown.jpeg",
  "/collections/female_shirts/shirtCream.jpeg",
  "/collections/tracks/track.jpg",
  "/collections/tracks/track2.jpg",
  "/collections/men_shirt/shirtCollection.jpeg",
  "/home/boxModel.jpg",
  "/home/hoodieBlackMan.jpg",
  "/home/manBeach.jpg",
  "/home/shadesMan.jpg",
  "/home/womanXman.jpg",
  "/creed/creed.jpg",
];

interface ImagePickerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelect: (url: string) => void;
}

export function ImagePicker({ open, onOpenChange, onSelect }: ImagePickerProps) {
  const [pasteUrl, setPasteUrl] = useState("");

  const handleSelect = (url: string) => {
    onSelect(url);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Select Image</DialogTitle>
        </DialogHeader>
        <Tabs defaultValue="library">
          <TabsList>
            <TabsTrigger value="library">From Library</TabsTrigger>
            <TabsTrigger value="url">Paste URL</TabsTrigger>
          </TabsList>
          <TabsContent value="library">
            <div className="grid grid-cols-4 gap-2 max-h-96 overflow-y-auto">
              {LIBRARY_IMAGES.map((img) => (
                <button
                  key={img}
                  onClick={() => handleSelect(img)}
                  className="relative aspect-square rounded overflow-hidden border border-zinc-100 hover:border-zinc-400 transition-colors focus:outline-none"
                >
                  <Image
                    src={img}
                    alt=""
                    fill
                    className="object-cover"
                    sizes="120px"
                    onError={() => {}}
                  />
                </button>
              ))}
            </div>
          </TabsContent>
          <TabsContent value="url">
            <div className="space-y-4">
              <Input
                placeholder="https://example.com/image.jpg"
                value={pasteUrl}
                onChange={(e) => setPasteUrl(e.target.value)}
              />
              {pasteUrl && (
                <div className="relative h-40 rounded overflow-hidden border border-zinc-100">
                  <Image src={pasteUrl} alt="Preview" fill className="object-contain" />
                </div>
              )}
              <Button
                onClick={() => pasteUrl && handleSelect(pasteUrl)}
                disabled={!pasteUrl}
                className="w-full"
              >
                Use This Image
              </Button>
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
