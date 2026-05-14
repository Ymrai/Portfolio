"use client";

import { useState } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { X, ChevronLeft, ChevronRight } from "lucide-react";
import type { CaseStudySection as Section } from "@/types";

interface CaseStudySectionProps {
  label: string;
  section: Section;
}

export function CaseStudySection({ label, section }: CaseStudySectionProps) {
  const [lightboxIdx, setLightboxIdx] = useState<number | null>(null);

  if (!section.text && section.images.length === 0) return null;

  function prev() {
    setLightboxIdx((i) =>
      i !== null ? (i - 1 + section.images.length) % section.images.length : null
    );
  }

  function next() {
    setLightboxIdx((i) =>
      i !== null ? (i + 1) % section.images.length : null
    );
  }

  return (
    <div className="space-y-5">
      <h2 className="font-semibold uppercase tracking-widest" style={{ fontSize: "16px" }}>{label}</h2>

      {section.text && (
        <div className="space-y-3">
          {section.text.split("\n").map((para, i) =>
            para ? (
              <p
                key={i}
                style={{
                  fontSize: "18px",
                  lineHeight: "1.7",
                  color: "var(--secondary-body)",
                }}
              >
                {para}
              </p>
            ) : null
          )}
        </div>
      )}

      {section.images.length > 0 && (
        <div
          className={`grid gap-3 ${
            section.images.length === 1
              ? "grid-cols-1"
              : section.images.length === 2
                ? "grid-cols-2"
                : "grid-cols-2 sm:grid-cols-3"
          }`}
        >
          {section.images.map((src, idx) => (
            <button
              key={src}
              type="button"
              onClick={() => setLightboxIdx(idx)}
              className={`overflow-hidden rounded-lg border bg-muted cursor-zoom-in ${
                section.images.length === 1 ? "aspect-video" : "aspect-square sm:aspect-video"
              }`}
            >
              <img
                src={src}
                alt={`${label} image ${idx + 1}`}
                className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
              />
            </button>
          ))}
        </div>
      )}

      {/* Lightbox */}
      <Dialog
        open={lightboxIdx !== null}
        onOpenChange={(open) => !open && setLightboxIdx(null)}
      >
        <DialogContent className="max-w-5xl w-full p-0 bg-black/95 border-0">
          {lightboxIdx !== null && (
            <div className="relative flex items-center justify-center min-h-[60vh]">
              <img
                src={section.images[lightboxIdx]}
                alt={`${label} ${lightboxIdx + 1}`}
                className="max-h-[85vh] max-w-full object-contain"
              />
              <button
                type="button"
                onClick={() => setLightboxIdx(null)}
                className="absolute top-3 right-3 rounded-full bg-white/10 p-1.5 text-white hover:bg-white/20 transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
              {section.images.length > 1 && (
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
                    {lightboxIdx + 1} / {section.images.length}
                  </p>
                </>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
