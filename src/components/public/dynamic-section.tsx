"use client";

import { useState } from "react";
import Lightbox from "yet-another-react-lightbox";
import "yet-another-react-lightbox/styles.css";
import type { DynamicSection } from "@/types";
import { SectionSlider } from "./section-slider";
import { useTheme } from "@/components/providers/theme-provider";
import { renderInline } from "@/lib/render-inline";

interface DynamicSectionProps {
  section: DynamicSection;
}

/** Renders a string of text content as paragraphs and bullet lists. */
function renderTextContent(content: string) {
  type Run =
    | { kind: "bullets"; lines: string[] }
    | { kind: "para"; text: string };

  const runs: Run[] = [];
  for (const raw of content.split("\n")) {
    if (raw.startsWith("- ")) {
      const last = runs[runs.length - 1];
      if (last?.kind === "bullets") {
        last.lines.push(raw.slice(2));
      } else {
        runs.push({ kind: "bullets", lines: [raw.slice(2)] });
      }
    } else if (raw.trim()) {
      runs.push({ kind: "para", text: raw });
    }
  }

  return (
    <div className="space-y-3">
      {runs.map((run, i) =>
        run.kind === "bullets" ? (
          <ul key={i} className="list-disc pl-5 space-y-1.5">
            {run.lines.map((line, j) => (
              <li
                key={j}
                className="leading-relaxed"
                style={{ fontSize: "20px", color: "var(--secondary-body)" }}
              >
                {renderInline(line)}
              </li>
            ))}
          </ul>
        ) : (
          <p
            key={i}
            className="leading-relaxed"
            style={{ fontSize: "20px", color: "var(--secondary-body)" }}
          >
            {renderInline(run.text)}
          </p>
        )
      )}
    </div>
  );
}

export function DynamicSectionRenderer({ section }: DynamicSectionProps) {
  const [lightboxIndex, setLightboxIndex] = useState(-1); // -1 = closed
  const { resolvedTheme } = useTheme();
  // In dark mode ignore the admin-selected caption color (often too dark to read)
  // and fall back to the CSS variable that is already tuned for dark backgrounds.
  const captionColor =
    resolvedTheme === "dark"
      ? "var(--secondary-body)"
      : section.caption_color || "var(--secondary-body)";

  const hasContent = section.blocks.some(
    (b) =>
      (b.type === "text" && b.content?.trim()) ||
      (b.type === "image" && b.url) ||
      (b.type === "slider" && (b.images?.length ?? 0) > 0)
  );
  if (!hasContent) return null;

  // Collect all image blocks in this section for the carousel
  const imageBlocks = section.blocks.filter((b) => b.type === "image" && b.url);
  const slides = imageBlocks.map((b) => ({
    src: b.url!,
    alt: b.alt ?? "",
  }));

  return (
    <div className="space-y-6">
      {(section.caption || section.title) && (
        <div className="space-y-2">
          {section.caption && (
            <p
              className="font-semibold uppercase tracking-widest"
              style={{ fontSize: "16px", color: captionColor }}
            >
              {section.caption}
            </p>
          )}
          {section.title && (
            <h2
              className="font-semibold tracking-tight"
              style={{ fontSize: "32px" }}
            >
              {section.title}
            </h2>
          )}
          {section.subtitle && (
            <p
              className="leading-snug"
              style={{ fontSize: "20px", color: "var(--secondary-body)" }}
            >
              {section.subtitle}
            </p>
          )}
        </div>
      )}

      <div className="space-y-10">
        {section.blocks.map((block) => {
          if (block.type === "text" && (block.content?.trim() || block.content_right?.trim() || block.column_right_image_url)) {
            if (block.layout === "two-column") {
              const imageLeft = block.column_order === "image-left";

              // Text + Image
              if (block.column_right_type === "image") {
                const textCol = (
                  <div key="text" className={imageLeft ? "md:order-2" : ""}>
                    {block.content?.trim() ? renderTextContent(block.content) : null}
                  </div>
                );
                const imageCol = (
                  <div key="image" className={imageLeft ? "md:order-1" : ""}>
                    {block.column_right_image_url ? (
                      <img
                        src={block.column_right_image_url}
                        alt=""
                        className="w-full h-full"
                        style={{ objectFit: "contain", display: "block" }}
                      />
                    ) : null}
                  </div>
                );
                return (
                  <div key={block.id} className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
                    {textCol}
                    {imageCol}
                  </div>
                );
              }

              // Text + Text
              return (
                <div key={block.id} className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div>{block.content?.trim() ? renderTextContent(block.content) : null}</div>
                  <div>{block.content_right?.trim() ? renderTextContent(block.content_right) : null}</div>
                </div>
              );
            }

            return (
              <div key={block.id}>
                {block.content?.trim() ? renderTextContent(block.content) : null}
              </div>
            );
          }

          if (block.type === "image" && block.url) {
            // Find which slide index this image corresponds to
            const slideIdx = slides.findIndex((s) => s.src === block.url);

            return (
              <figure
                key={block.id}
                className="space-y-3"
                style={{ width: "min(calc(100vw - 48px), 1232px)" }}
              >
                <button
                  type="button"
                  onClick={() => setLightboxIndex(slideIdx)}
                  className="w-full block rounded-xl overflow-hidden cursor-zoom-in focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                >
                  <img
                    src={block.url}
                    alt={block.alt ?? ""}
                    className="w-full hover:opacity-95 transition-opacity duration-200"
                    style={{ display: "block" }}
                  />
                </button>
                {block.alt && (
                  <figcaption
                    className="text-sm text-center"
                    style={{ color: "var(--secondary-body)" }}
                  >
                    {block.alt}
                  </figcaption>
                )}
              </figure>
            );
          }

          if (block.type === "slider" && (block.images?.length ?? 0) > 0) {
            return (
              <div key={block.id}>
                <SectionSlider images={block.images!} />
              </div>
            );
          }

          return null;
        })}
      </div>

      {/* Lightbox — scoped to images within this section */}
      {slides.length > 0 && (
        <Lightbox
          open={lightboxIndex >= 0}
          index={lightboxIndex}
          close={() => setLightboxIndex(-1)}
          slides={slides}
          styles={{
            container: { backgroundColor: "rgba(0, 0, 0, 0.92)" },
          }}
          animation={{ fade: 250, swipe: 300 }}
          controller={{ closeOnBackdropClick: true }}
          carousel={{ finite: slides.length <= 1 }}
          render={{
            // Hide prev/next arrows when there's only one image
            ...(slides.length <= 1 && {
              buttonPrev: () => null,
              buttonNext: () => null,
            }),
          }}
        />
      )}
    </div>
  );
}
