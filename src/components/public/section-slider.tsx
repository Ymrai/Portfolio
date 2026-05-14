"use client";

import { useCallback, useEffect, useState } from "react";
import useEmblaCarousel from "embla-carousel-react";
import Lightbox from "yet-another-react-lightbox";
import "yet-another-react-lightbox/styles.css";
import { ChevronLeft, ChevronRight } from "lucide-react";
import type { SliderImage } from "@/types";

interface SectionSliderProps {
  images: SliderImage[];
}

export function SectionSlider({ images }: SectionSliderProps) {
  const [emblaRef, emblaApi] = useEmblaCarousel({
    loop: false,
    align: "center",
    containScroll: "keepSnaps",
  });

  const [selectedIndex, setSelectedIndex] = useState(0);
  const [canPrev, setCanPrev] = useState(false);
  const [canNext, setCanNext] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(-1);

  const onSelect = useCallback(() => {
    if (!emblaApi) return;
    setSelectedIndex(emblaApi.selectedScrollSnap());
    setCanPrev(emblaApi.canScrollPrev());
    setCanNext(emblaApi.canScrollNext());
  }, [emblaApi]);

  useEffect(() => {
    if (!emblaApi) return;
    emblaApi.on("select", onSelect);
    emblaApi.on("reInit", onSelect);
    onSelect();
  }, [emblaApi, onSelect]);

  const scrollPrev = useCallback(() => emblaApi?.scrollPrev(), [emblaApi]);
  const scrollNext = useCallback(() => emblaApi?.scrollNext(), [emblaApi]);

  if (images.length === 0) return null;

  const slides = images.map((img) => ({ src: img.url, alt: img.alt ?? "" }));
  const multiSlide = images.length > 1;

  return (
    <div
      className="relative"
      style={{ width: "min(calc(100vw - 48px), 1232px)" }}
    >
      {/* Embla viewport — overflow:hidden clips the track; no rounded corners
          here so the peeking edges of adjacent slides are not clipped */}
      <div ref={emblaRef} className="overflow-hidden">
        <div className={`flex ${multiSlide ? "gap-4" : ""}`}>
          {images.map((img, i) => (
            <div
              key={img.id}
              /* single image: full width; multiple: 88% so adjacent slides peek */
              className={multiSlide ? "flex-[0_0_80%] min-w-0" : "flex-[0_0_100%]"}
            >
              <button
                type="button"
                onClick={() => setLightboxIndex(i)}
                className="w-full block rounded-xl overflow-hidden cursor-zoom-in focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
              >
                <img
                  src={img.url}
                  alt={img.alt ?? ""}
                  className="w-full hover:opacity-95 transition-opacity duration-200"
                  style={{ display: "block" }}
                />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Prev arrow — only shown when there is a previous slide */}
      {canPrev && (
        <button
          type="button"
          onClick={scrollPrev}
          className="absolute left-3 top-1/2 -translate-y-1/2 flex items-center justify-center w-9 h-9 rounded-full bg-black/40 hover:bg-black/60 text-white transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
          aria-label="Previous image"
        >
          <ChevronLeft className="h-5 w-5" />
        </button>
      )}

      {/* Next arrow — only shown when there is a next slide */}
      {canNext && (
        <button
          type="button"
          onClick={scrollNext}
          className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center justify-center w-9 h-9 rounded-full bg-black/40 hover:bg-black/60 text-white transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
          aria-label="Next image"
        >
          <ChevronRight className="h-5 w-5" />
        </button>
      )}

      {/* Dot indicators */}
      {multiSlide && (
        <div className="flex justify-center gap-1.5 mt-3">
          {images.map((_, i) => (
            <button
              key={i}
              type="button"
              onClick={() => emblaApi?.scrollTo(i)}
              aria-label={`Go to image ${i + 1}`}
              className={`h-2 rounded-full transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary ${
                i === selectedIndex
                  ? "w-5 bg-foreground"
                  : "w-2 bg-foreground/30 hover:bg-foreground/50"
              }`}
            />
          ))}
        </div>
      )}

      {/* Caption for current slide */}
      {images[selectedIndex]?.alt && (
        <p
          className="text-sm text-center mt-2"
          style={{ color: "var(--secondary-body)" }}
        >
          {images[selectedIndex].alt}
        </p>
      )}

      {/* Lightbox */}
      <Lightbox
        open={lightboxIndex >= 0}
        index={lightboxIndex}
        close={() => setLightboxIndex(-1)}
        slides={slides}
        styles={{ container: { backgroundColor: "rgba(0, 0, 0, 0.92)" } }}
        animation={{ fade: 250, swipe: 300 }}
        controller={{ closeOnBackdropClick: true }}
        carousel={{ finite: !multiSlide }}
        render={{
          ...(!multiSlide && {
            buttonPrev: () => null,
            buttonNext: () => null,
          }),
        }}
      />
    </div>
  );
}
