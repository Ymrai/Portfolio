"use client";

import { useRef, useState } from "react";
import { Plus, X, Loader2, GripVertical } from "lucide-react";
import { uploadFileClient, deleteFileClient } from "@/lib/supabase/upload";
import { toast } from "sonner";

interface GalleryUploadProps {
  value: string[];
  onChange: (urls: string[]) => void;
  folder: string;
  maxImages?: number;
}

export function GalleryUpload({
  value,
  onChange,
  folder,
  maxImages = 20,
}: GalleryUploadProps) {
  const [uploading, setUploading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const dragIdx = useRef<number | null>(null);

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []);
    if (!files.length) return;
    e.target.value = "";

    const remaining = maxImages - value.length;
    const toUpload = files.slice(0, remaining);
    if (files.length > remaining)
      toast.warning(`Only ${remaining} more image(s) allowed`);

    setUploading(true);
    const results = await Promise.all(
      toUpload.map((file) => uploadFileClient(file, folder))
    );
    setUploading(false);

    const urls = results.filter((r) => !r.error).map((r) => r.url);
    const errors = results.filter((r) => r.error);
    if (errors.length) toast.error(`${errors.length} upload(s) failed`);
    if (urls.length) onChange([...value, ...urls]);
  }

  async function remove(idx: number) {
    const url = value[idx];
    onChange(value.filter((_, i) => i !== idx));
    await deleteFileClient(url);
  }

  function onDragStart(idx: number) {
    dragIdx.current = idx;
  }

  function onDrop(targetIdx: number) {
    if (dragIdx.current === null || dragIdx.current === targetIdx) return;
    const next = [...value];
    const [item] = next.splice(dragIdx.current, 1);
    next.splice(targetIdx, 0, item);
    onChange(next);
    dragIdx.current = null;
  }

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-3 gap-2 sm:grid-cols-4 lg:grid-cols-5">
        {value.map((url, idx) => (
          <div
            key={url}
            draggable
            onDragStart={() => onDragStart(idx)}
            onDragOver={(e) => e.preventDefault()}
            onDrop={() => onDrop(idx)}
            className="group relative aspect-square rounded-md overflow-hidden border bg-muted cursor-grab active:cursor-grabbing"
          >
            <img
              src={url}
              alt={`Gallery ${idx + 1}`}
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors" />
            <button
              type="button"
              onClick={() => remove(idx)}
              className="absolute top-1 right-1 rounded-full bg-background/80 p-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <X className="h-3 w-3" />
            </button>
            <GripVertical className="absolute bottom-1 left-1 h-3 w-3 text-white opacity-0 group-hover:opacity-60 transition-opacity" />
          </div>
        ))}

        {value.length < maxImages && (
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            disabled={uploading}
            className="aspect-square rounded-md border border-dashed border-input flex flex-col items-center justify-center gap-1 text-muted-foreground hover:bg-muted/60 transition-colors"
          >
            {uploading ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              <>
                <Plus className="h-5 w-5" />
                <span className="text-xs">Add</span>
              </>
            )}
          </button>
        )}
      </div>
      {value.length > 0 && (
        <p className="text-xs text-muted-foreground">
          Drag to reorder · {value.length}/{maxImages} images
        </p>
      )}
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={handleFileChange}
      />
    </div>
  );
}
