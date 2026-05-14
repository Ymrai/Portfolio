"use client";

import { useState } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { X, ChevronLeft, ChevronRight } from "lucide-react";

interface ImageGalleryProps {
  images: string[];
  title?: string;
}

export function ImageGallery({ images, title }: ImageGalleryProps) {
  const [lightboxIdx, setLightboxIdx] = useState<number | null>(null);

  if (images.length === 0) return null;

  function prev() {
    setLightboxIdx((i) =>
      i !== null ? (i - 1 + images.length) % images.length : null
    );
  }

  function next() {
    setLightboxIdx((i) =>
      i !== null ? (i + 1) % images.length : null
    );
  }

  return (
    <>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        {images.map((src, idx) => (
          <button
            key={src}
            type="button"
            onClick={() => setLightboxIdx(idx)}
            className="aspect-square overflow-hidden rounded-lg border bg-muted cursor-zoom-in"
          >
            <img
              src={src}
              alt={`${title ?? "Gallery"} image ${idx + 1}`}
              className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
            />
          </button>
        ))}
      </div>

      <Dialog
        open={lightboxIdx !== null}
        onOpenChange={(open) => !open && setLightboxIdx(null)}
      >
        <DialogContent className="max-w-5xl w-full p-0 bg-black/95 border-0">
          {lightboxIdx !== null && (
            <div className="relative flex items-center justify-center min-h-[60vh]">
              <img
                src={images[lightboxIdx]}
                alt={`${title ?? "Gallery"} ${lightboxIdx + 1}`}
                className="max-h-[85vh] max-w-full object-contain"
              />
              <button
                type="button"
                onClick={() => setLightboxIdx(null)}
                className="absolute top-3 right-3 rounded-full bg-white/10 p-1.5 text-white hover:bg-white/20 transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
              {images.length > 1 && (
                <>
                  <button
                    type="button"
                    onClick={prev}
                    className="absolute left-3 rounded-full bg-white/10 p-1.5 text-white hover:bg-white/20 transition-colors"
                  >
                    <ChevronLeft className="h-5 w-5" />
                  </button>
                  <button
                    type="button"
                    onClick={next}
                    className="absolute right-3 rounded-full bg-white/10 p-1.5 text-white hover:bg-white/20 transition-colors"
                  >
                    <ChevronRight className="h-5 w-5" />
                  </button>
                  <p className="absolute bottom-3 left-1/2 -translate-x-1/2 text-white/60 text-sm">
                    {lightboxIdx + 1} / {images.length}
                  </p>
                </>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
