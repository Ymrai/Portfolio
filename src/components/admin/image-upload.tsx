"use client";

import { useRef, useState } from "react";
import { Upload, X, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { uploadFileClient, deleteFileClient } from "@/lib/supabase/upload";
import { toast } from "sonner";

interface ImageUploadProps {
  value: string;
  onChange: (url: string) => void;
  folder: string;
  aspectRatio?: "video" | "square" | "free";
  label?: string;
}

export function ImageUpload({
  value,
  onChange,
  folder,
  aspectRatio = "video",
  label = "Upload Image",
}: ImageUploadProps) {
  const [uploading, setUploading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const ratioClass =
    aspectRatio === "video"
      ? "aspect-video"
      : aspectRatio === "square"
        ? "aspect-square"
        : "min-h-32";

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = "";

    setUploading(true);
    const result = await uploadFileClient(file, folder);
    setUploading(false);

    if (result.error) {
      toast.error(result.error);
    } else {
      onChange(result.url);
    }
  }

  async function handleRemove() {
    if (value) await deleteFileClient(value);
    onChange("");
  }

  return (
    <div className="space-y-2">
      {value ? (
        <div className={`relative w-full ${ratioClass} rounded-md overflow-hidden border bg-muted`}>
          <img
            src={value}
            alt="Preview"
            className="w-full h-full object-cover"
          />
          <button
            type="button"
            onClick={handleRemove}
            className="absolute top-2 right-2 rounded-full bg-background/80 p-1 hover:bg-background transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={uploading}
          className={`flex w-full ${ratioClass} flex-col items-center justify-center gap-2 rounded-md border border-dashed border-input bg-muted/30 text-muted-foreground hover:bg-muted/60 transition-colors`}
        >
          {uploading ? (
            <Loader2 className="h-6 w-6 animate-spin" />
          ) : (
            <Upload className="h-6 w-6" />
          )}
          <span className="text-sm">{uploading ? "Uploading…" : label}</span>
        </button>
      )}
      {value && (
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => inputRef.current?.click()}
          disabled={uploading}
        >
          {uploading ? (
            <>
              <Loader2 className="h-3 w-3 mr-1 animate-spin" />
              Uploading…
            </>
          ) : (
            "Replace"
          )}
        </Button>
      )}
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleFileChange}
      />
    </div>
  );
}
