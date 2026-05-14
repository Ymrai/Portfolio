"use client";

import { useRef, useState } from "react";
import { FilePdf, Upload, X, ArrowSquareOut } from "@phosphor-icons/react";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { uploadFileClient, deleteFileClient } from "@/lib/supabase/upload";
import { toast } from "sonner";

interface PdfUploadProps {
  value: string;
  onChange: (url: string) => void;
  folder?: string;
}

function fileName(url: string): string {
  try {
    const decoded = decodeURIComponent(new URL(url).pathname);
    const raw = decoded.split("/").pop() ?? "resume.pdf";
    return raw.replace(/^\d+-[a-z0-9]+\./, "resume.");
  } catch {
    return "resume.pdf";
  }
}

export function PdfUpload({
  value,
  onChange,
  folder = "resumes",
}: PdfUploadProps) {
  const [uploading, setUploading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = "";

    if (file.type !== "application/pdf" && !file.name.endsWith(".pdf")) {
      toast.error("Only PDF files are allowed");
      return;
    }

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
        <div className="flex items-center gap-3 rounded-md border border-border bg-muted/30 px-4 py-3">
          <FilePdf size={20} className="text-red-500 shrink-0" />
          <span className="text-sm truncate flex-1 text-foreground">
            {fileName(value)}
          </span>
          <a
            href={value}
            target="_blank"
            rel="noopener noreferrer"
            className="text-muted-foreground hover:text-foreground transition-colors shrink-0"
            title="Open PDF"
          >
            <ArrowSquareOut size={16} />
          </a>
          <button
            type="button"
            onClick={handleRemove}
            className="text-muted-foreground hover:text-destructive transition-colors shrink-0"
            title="Remove"
          >
            <X size={16} />
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={uploading}
          className="flex w-full items-center justify-center gap-2 rounded-md border border-dashed border-input bg-muted/30 py-5 text-muted-foreground hover:bg-muted/60 transition-colors"
        >
          {uploading ? (
            <Loader2 className="h-5 w-5 animate-spin" />
          ) : (
            <Upload size={18} />
          )}
          <span className="text-sm">
            {uploading ? "Uploading…" : "Upload PDF resume"}
          </span>
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
            "Replace PDF"
          )}
        </Button>
      )}
      <input
        ref={inputRef}
        type="file"
        accept=".pdf,application/pdf"
        className="hidden"
        onChange={handleFileChange}
      />
    </div>
  );
}
