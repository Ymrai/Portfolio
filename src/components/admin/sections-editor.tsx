"use client";

import { useState } from "react";
import {
  DndContext,
  closestCenter,
  PointerSensor,
  KeyboardSensor,
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
import { CSS } from "@dnd-kit/utilities";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { ImageUpload } from "./image-upload";
import type { DynamicSection, SectionBlock, SliderImage } from "@/types";
import { Trash2, ArrowUp, ArrowDown, Plus, Image, Type, GripVertical, Layers, RefreshCw } from "lucide-react";

// ── Slider image item (draggable) ─────────────────────────────────────────────

function SliderImageItem({
  img,
  folder,
  onDelete,
  onUpdateAlt,
  onReplace,
}: {
  img: SliderImage;
  folder: string;
  onDelete: () => void;
  onUpdateAlt: (alt: string) => void;
  onReplace: (url: string) => void;
}) {
  const [replacing, setReplacing] = useState(false);
  const [replaceKey, setReplaceKey] = useState(0);

  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: img.id });

  return (
    <div
      ref={setNodeRef}
      style={{
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.4 : 1,
      }}
      className="border border-border/60 rounded-lg p-2 bg-background space-y-2"
    >
      {/* Main row: grip · thumbnail · alt input · replace · delete */}
      <div className="flex items-center gap-2">
        <button
          type="button"
          {...attributes}
          {...listeners}
          suppressHydrationWarning
          className="cursor-grab active:cursor-grabbing text-muted-foreground hover:text-foreground touch-none shrink-0"
        >
          <GripVertical className="h-4 w-4" />
        </button>
        {img.url && (
          <img src={img.url} alt="" className="w-16 h-12 object-cover rounded shrink-0" />
        )}
        <Input
          value={img.alt ?? ""}
          onChange={(e) => onUpdateAlt(e.target.value)}
          placeholder="Caption (optional)"
          className="flex-1 text-sm h-8"
        />
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className={`h-7 w-7 shrink-0 transition-colors ${replacing ? "text-foreground" : "text-muted-foreground hover:text-foreground"}`}
          onClick={() => setReplacing((v) => !v)}
          title={replacing ? "Cancel replace" : "Replace image"}
        >
          <RefreshCw className="h-3.5 w-3.5" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="h-7 w-7 shrink-0 text-muted-foreground hover:text-destructive"
          onClick={onDelete}
        >
          <Trash2 className="h-3.5 w-3.5" />
        </Button>
      </div>

      {/* Inline replacer — shown when replace button is active */}
      {replacing && (
        <div className="pl-6">
          <ImageUpload
            key={replaceKey}
            value=""
            onChange={(url) => {
              if (url) {
                onReplace(url);
                setReplacing(false);
                setReplaceKey((k) => k + 1);
              }
            }}
            folder={folder}
            aspectRatio="free"
            label="Upload replacement image"
          />
        </div>
      )}
    </div>
  );
}

// ── Image adder — resets ImageUpload after each upload ────────────────────────

function SliderImageAdder({
  onAdd,
  folder,
}: {
  onAdd: (url: string) => void;
  folder: string;
}) {
  const [resetKey, setResetKey] = useState(0);
  return (
    <ImageUpload
      key={resetKey}
      value=""
      onChange={(url) => {
        if (url) {
          onAdd(url);
          setResetKey((k) => k + 1);
        }
      }}
      folder={folder}
      aspectRatio="free"
      label="Add image to slider"
    />
  );
}

interface SectionsEditorProps {
  value: DynamicSection[];
  onChange: (sections: DynamicSection[]) => void;
  projectId?: string;
}

function uid() {
  return Math.random().toString(36).slice(2, 10);
}

export function SectionsEditor({ value, onChange, projectId }: SectionsEditorProps) {
  // Sensors for slider image drag-to-reorder
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  // ── Section helpers ──────────────────────────────────────────────────────────

  function addSection() {
    onChange([...value, { id: uid(), caption: "", caption_color: "#757575", title: "", subtitle: "", blocks: [] }]);
  }

  function deleteSection(sIdx: number) {
    onChange(value.filter((_, i) => i !== sIdx));
  }

  function moveSection(sIdx: number, dir: -1 | 1) {
    const next = [...value];
    const swap = sIdx + dir;
    if (swap < 0 || swap >= next.length) return;
    [next[sIdx], next[swap]] = [next[swap], next[sIdx]];
    onChange(next);
  }

  function updateSectionTitle(sIdx: number, title: string) {
    const next = [...value];
    next[sIdx] = { ...next[sIdx], title };
    onChange(next);
  }

  function updateSectionSubtitle(sIdx: number, subtitle: string) {
    const next = [...value];
    next[sIdx] = { ...next[sIdx], subtitle };
    onChange(next);
  }

  function updateSectionCaption(sIdx: number, caption: string) {
    const next = [...value];
    next[sIdx] = { ...next[sIdx], caption };
    onChange(next);
  }

  function updateSectionCaptionColor(sIdx: number, caption_color: string) {
    const next = [...value];
    next[sIdx] = { ...next[sIdx], caption_color };
    onChange(next);
  }

  // ── Block helpers ────────────────────────────────────────────────────────────

  function addSliderImage(sIdx: number, bIdx: number, url: string) {
    const img: SliderImage = { id: uid(), url, alt: "" };
    const next = [...value];
    const blocks = [...next[sIdx].blocks];
    const block = blocks[bIdx];
    blocks[bIdx] = { ...block, images: [...(block.images ?? []), img] };
    next[sIdx] = { ...next[sIdx], blocks };
    onChange(next);
  }

  function deleteSliderImage(sIdx: number, bIdx: number, imgId: string) {
    const next = [...value];
    const blocks = [...next[sIdx].blocks];
    const block = blocks[bIdx];
    blocks[bIdx] = { ...block, images: (block.images ?? []).filter((im) => im.id !== imgId) };
    next[sIdx] = { ...next[sIdx], blocks };
    onChange(next);
  }

  function replaceSliderImage(sIdx: number, bIdx: number, imgId: string, url: string) {
    const next = [...value];
    const blocks = [...next[sIdx].blocks];
    const block = blocks[bIdx];
    blocks[bIdx] = {
      ...block,
      images: (block.images ?? []).map((im) => (im.id === imgId ? { ...im, url } : im)),
    };
    next[sIdx] = { ...next[sIdx], blocks };
    onChange(next);
  }

  function updateSliderImageAlt(sIdx: number, bIdx: number, imgId: string, alt: string) {
    const next = [...value];
    const blocks = [...next[sIdx].blocks];
    const block = blocks[bIdx];
    blocks[bIdx] = {
      ...block,
      images: (block.images ?? []).map((im) => (im.id === imgId ? { ...im, alt } : im)),
    };
    next[sIdx] = { ...next[sIdx], blocks };
    onChange(next);
  }

  function reorderSliderImages(sIdx: number, bIdx: number, event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const next = [...value];
    const blocks = [...next[sIdx].blocks];
    const block = blocks[bIdx];
    const images = block.images ?? [];
    const oldIndex = images.findIndex((im) => im.id === active.id);
    const newIndex = images.findIndex((im) => im.id === over.id);
    if (oldIndex < 0 || newIndex < 0) return;
    blocks[bIdx] = { ...block, images: arrayMove(images, oldIndex, newIndex) };
    next[sIdx] = { ...next[sIdx], blocks };
    onChange(next);
  }

  function addBlock(sIdx: number, type: "text" | "image" | "slider") {
    const block: SectionBlock =
      type === "text"
        ? { id: uid(), type: "text", content: "" }
        : type === "image"
        ? { id: uid(), type: "image", url: "", alt: "" }
        : { id: uid(), type: "slider", images: [] };
    const next = [...value];
    next[sIdx] = { ...next[sIdx], blocks: [...next[sIdx].blocks, block] };
    onChange(next);
  }

  function deleteBlock(sIdx: number, bIdx: number) {
    const next = [...value];
    next[sIdx] = { ...next[sIdx], blocks: next[sIdx].blocks.filter((_, i) => i !== bIdx) };
    onChange(next);
  }

  function moveBlock(sIdx: number, bIdx: number, dir: -1 | 1) {
    const next = [...value];
    const blocks = [...next[sIdx].blocks];
    const swap = bIdx + dir;
    if (swap < 0 || swap >= blocks.length) return;
    [blocks[bIdx], blocks[swap]] = [blocks[swap], blocks[bIdx]];
    next[sIdx] = { ...next[sIdx], blocks };
    onChange(next);
  }

  function updateBlock(sIdx: number, bIdx: number, patch: Partial<SectionBlock>) {
    const next = [...value];
    const blocks = [...next[sIdx].blocks];
    blocks[bIdx] = { ...blocks[bIdx], ...patch };
    next[sIdx] = { ...next[sIdx], blocks };
    onChange(next);
  }

  // ── Render ───────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-4">
      {value.map((section, sIdx) => (
        <div key={section.id} className="border border-border rounded-xl overflow-hidden">
          {/* Section header */}
          <div className="flex items-start gap-2 bg-muted/40 px-4 py-3 border-b border-border">
            <GripVertical className="h-4 w-4 text-muted-foreground shrink-0 mt-1.5" />
            <div className="flex-1 flex flex-col gap-1 min-w-0">
              {/* Caption row */}
              <div className="flex items-center gap-2">
                <Input
                  value={section.caption ?? ""}
                  onChange={(e) => updateSectionCaption(sIdx, e.target.value)}
                  placeholder="Caption (optional)…"
                  className="h-7 text-xs bg-transparent border-0 shadow-none px-0 focus-visible:ring-0 text-muted-foreground flex-1"
                />
                <input
                  type="color"
                  value={section.caption_color || "#757575"}
                  onChange={(e) => updateSectionCaptionColor(sIdx, e.target.value)}
                  className="h-6 w-8 cursor-pointer rounded border border-input bg-transparent p-0.5 shrink-0"
                  title="Caption color"
                />
                <Input
                  value={section.caption_color || "#757575"}
                  onChange={(e) => updateSectionCaptionColor(sIdx, e.target.value)}
                  placeholder="#757575"
                  className="h-7 w-24 text-xs font-mono bg-transparent border-0 shadow-none px-0 focus-visible:ring-0 text-muted-foreground shrink-0"
                />
              </div>
              {/* Title */}
              <Input
                value={section.title}
                onChange={(e) => updateSectionTitle(sIdx, e.target.value)}
                placeholder="Section title…"
                className="h-8 text-sm font-medium bg-transparent border-0 shadow-none px-0 focus-visible:ring-0"
              />
              {/* Subtitle */}
              <Input
                value={section.subtitle ?? ""}
                onChange={(e) => updateSectionSubtitle(sIdx, e.target.value)}
                placeholder="Subtitle (optional)…"
                className="h-7 text-xs bg-transparent border-0 shadow-none px-0 focus-visible:ring-0 text-muted-foreground"
              />
            </div>
            <div className="flex items-center gap-1 ml-auto shrink-0">
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-7 w-7"
                onClick={() => moveSection(sIdx, -1)}
                disabled={sIdx === 0}
                title="Move section up"
              >
                <ArrowUp className="h-3.5 w-3.5" />
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-7 w-7"
                onClick={() => moveSection(sIdx, 1)}
                disabled={sIdx === value.length - 1}
                title="Move section down"
              >
                <ArrowDown className="h-3.5 w-3.5" />
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-7 w-7 text-destructive hover:text-destructive"
                onClick={() => deleteSection(sIdx)}
                title="Delete section"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>

          {/* Blocks */}
          <div className="p-4 space-y-3">
            {section.blocks.length === 0 && (
              <p className="text-xs text-muted-foreground text-center py-2">
                No content blocks yet. Add a text or image block below.
              </p>
            )}

            {section.blocks.map((block, bIdx) => (
              <div key={block.id} className="flex gap-2 items-start group">
                {/* Reorder */}
                <div className="flex flex-col gap-0.5 pt-2 shrink-0">
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6"
                    onClick={() => moveBlock(sIdx, bIdx, -1)}
                    disabled={bIdx === 0}
                  >
                    <ArrowUp className="h-3 w-3" />
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6"
                    onClick={() => moveBlock(sIdx, bIdx, 1)}
                    disabled={bIdx === section.blocks.length - 1}
                  >
                    <ArrowDown className="h-3 w-3" />
                  </Button>
                </div>

                {/* Block content */}
                <div className="flex-1 border border-border/60 rounded-lg p-3 bg-background">
                  <div className="flex items-center gap-2 mb-2">
                    {block.type === "text" ? (
                      <Type className="h-3.5 w-3.5 text-muted-foreground" />
                    ) : block.type === "slider" ? (
                      <Layers className="h-3.5 w-3.5 text-muted-foreground" />
                    ) : (
                      <Image className="h-3.5 w-3.5 text-muted-foreground" />
                    )}
                    <span className="text-xs font-medium text-muted-foreground capitalize">
                      {block.type} block
                    </span>
                  </div>

                  {block.type === "text" ? (
                    <div className="space-y-2">
                      {/* Layout toggle */}
                      <div className="flex items-center gap-1 p-0.5 bg-muted rounded-md w-fit">
                        <button
                          type="button"
                          onClick={() => updateBlock(sIdx, bIdx, { layout: "single" })}
                          className={`text-xs px-2.5 py-1 rounded transition-colors ${
                            (block.layout ?? "single") === "single"
                              ? "bg-background text-foreground shadow-sm"
                              : "text-muted-foreground hover:text-foreground"
                          }`}
                        >
                          Single column
                        </button>
                        <button
                          type="button"
                          onClick={() => updateBlock(sIdx, bIdx, { layout: "two-column" })}
                          className={`text-xs px-2.5 py-1 rounded transition-colors ${
                            block.layout === "two-column"
                              ? "bg-background text-foreground shadow-sm"
                              : "text-muted-foreground hover:text-foreground"
                          }`}
                        >
                          Two columns
                        </button>
                      </div>

                      {/* Two-column sub-options */}
                      {block.layout === "two-column" && (
                        <div className="space-y-2">
                          {/* Right column type toggle */}
                          <div className="flex items-center gap-1 p-0.5 bg-muted rounded-md w-fit">
                            <button
                              type="button"
                              onClick={() => updateBlock(sIdx, bIdx, { column_right_type: "text" })}
                              className={`text-xs px-2.5 py-1 rounded transition-colors ${
                                (block.column_right_type ?? "text") === "text"
                                  ? "bg-background text-foreground shadow-sm"
                                  : "text-muted-foreground hover:text-foreground"
                              }`}
                            >
                              Text + Text
                            </button>
                            <button
                              type="button"
                              onClick={() => updateBlock(sIdx, bIdx, { column_right_type: "image" })}
                              className={`text-xs px-2.5 py-1 rounded transition-colors ${
                                block.column_right_type === "image"
                                  ? "bg-background text-foreground shadow-sm"
                                  : "text-muted-foreground hover:text-foreground"
                              }`}
                            >
                              Text + Image
                            </button>
                          </div>

                          {/* Column order toggle — only for text+image */}
                          {block.column_right_type === "image" && (
                            <div className="flex items-center gap-1 p-0.5 bg-muted rounded-md w-fit">
                              <button
                                type="button"
                                onClick={() => updateBlock(sIdx, bIdx, { column_order: "text-left" })}
                                className={`text-xs px-2.5 py-1 rounded transition-colors ${
                                  (block.column_order ?? "text-left") === "text-left"
                                    ? "bg-background text-foreground shadow-sm"
                                    : "text-muted-foreground hover:text-foreground"
                                }`}
                              >
                                Text left / Image right
                              </button>
                              <button
                                type="button"
                                onClick={() => updateBlock(sIdx, bIdx, { column_order: "image-left" })}
                                className={`text-xs px-2.5 py-1 rounded transition-colors ${
                                  block.column_order === "image-left"
                                    ? "bg-background text-foreground shadow-sm"
                                    : "text-muted-foreground hover:text-foreground"
                                }`}
                              >
                                Image left / Text right
                              </button>
                            </div>
                          )}

                          {/* Column content inputs */}
                          <div className="grid grid-cols-2 gap-2">
                            <Textarea
                              value={block.content ?? ""}
                              onChange={(e) => updateBlock(sIdx, bIdx, { content: e.target.value })}
                              placeholder="Text column…"
                              rows={5}
                              className="text-sm resize-y"
                            />
                            {block.column_right_type === "image" ? (
                              <div className="space-y-1.5">
                                <ImageUpload
                                  value={block.column_right_image_url ?? ""}
                                  onChange={(url) => updateBlock(sIdx, bIdx, { column_right_image_url: url })}
                                  folder={`projects/${projectId ?? "new"}/sections/${section.id}`}
                                  aspectRatio="free"
                                  label="Upload image"
                                />
                              </div>
                            ) : (
                              <Textarea
                                value={block.content_right ?? ""}
                                onChange={(e) => updateBlock(sIdx, bIdx, { content_right: e.target.value })}
                                placeholder="Right column…"
                                rows={5}
                                className="text-sm resize-y"
                              />
                            )}
                          </div>
                        </div>
                      )}

                      {/* Single column content */}
                      {block.layout !== "two-column" && (
                        <Textarea
                          value={block.content ?? ""}
                          onChange={(e) => updateBlock(sIdx, bIdx, { content: e.target.value })}
                          placeholder="Write content here… Use **bold** for bold text. Start lines with '- ' for bullet points."
                          rows={4}
                          className="text-sm resize-y"
                        />
                      )}
                    </div>
                  ) : block.type === "slider" ? (
                    <div className="space-y-2">
                      <DndContext
                        sensors={sensors}
                        collisionDetection={closestCenter}
                        onDragEnd={(event) => reorderSliderImages(sIdx, bIdx, event)}
                      >
                        <SortableContext
                          items={(block.images ?? []).map((im) => im.id)}
                          strategy={verticalListSortingStrategy}
                        >
                          <div className="space-y-1.5">
                            {(block.images ?? []).map((img) => (
                              <SliderImageItem
                                key={img.id}
                                img={img}
                                folder={`projects/${projectId ?? "new"}/sections/${section.id}`}
                                onDelete={() => deleteSliderImage(sIdx, bIdx, img.id)}
                                onUpdateAlt={(alt) => updateSliderImageAlt(sIdx, bIdx, img.id, alt)}
                                onReplace={(url) => replaceSliderImage(sIdx, bIdx, img.id, url)}
                              />
                            ))}
                          </div>
                        </SortableContext>
                      </DndContext>
                      {(block.images ?? []).length === 0 && (
                        <p className="text-xs text-muted-foreground text-center py-1">
                          No images yet. Add images below.
                        </p>
                      )}
                      <SliderImageAdder
                        folder={`projects/${projectId ?? "new"}/sections/${section.id}`}
                        onAdd={(url) => addSliderImage(sIdx, bIdx, url)}
                      />
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <ImageUpload
                        value={block.url ?? ""}
                        onChange={(url) => updateBlock(sIdx, bIdx, { url })}
                        folder={`projects/${projectId ?? "new"}/sections/${section.id}`}
                        aspectRatio="free"
                        label="Upload image"
                      />
                      <Input
                        value={block.alt ?? ""}
                        onChange={(e) => updateBlock(sIdx, bIdx, { alt: e.target.value })}
                        placeholder="Alt text / caption (optional)"
                        className="text-sm"
                      />
                    </div>
                  )}
                </div>

                {/* Delete block */}
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 shrink-0 text-muted-foreground hover:text-destructive mt-1"
                  onClick={() => deleteBlock(sIdx, bIdx)}
                  title="Delete block"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
            ))}

            {/* Add block buttons */}
            <div className="flex gap-2 pt-1">
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="text-xs gap-1.5"
                onClick={() => addBlock(sIdx, "text")}
              >
                <Plus className="h-3.5 w-3.5" />
                Add text
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="text-xs gap-1.5"
                onClick={() => addBlock(sIdx, "image")}
              >
                <Plus className="h-3.5 w-3.5" />
                Add image
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="text-xs gap-1.5"
                onClick={() => addBlock(sIdx, "slider")}
              >
                <Plus className="h-3.5 w-3.5" />
                Add slider
              </Button>
            </div>
          </div>
        </div>
      ))}

      <Button
        type="button"
        variant="outline"
        className="w-full gap-2"
        onClick={addSection}
      >
        <Plus className="h-4 w-4" />
        Add section
      </Button>
    </div>
  );
}
