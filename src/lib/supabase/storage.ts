import { createServiceClient } from "./server";

const BUCKET = "portfolio-assets";

const ALLOWED_TYPES = [
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
  "image/gif",
  "image/svg+xml",
  "application/pdf",
];

async function ensureBucket() {
  const supabase = await createServiceClient();
  const { data } = await supabase.storage.getBucket(BUCKET);
  if (!data) {
    await supabase.storage.createBucket(BUCKET, {
      public: true,
      fileSizeLimit: 10 * 1024 * 1024,
      allowedMimeTypes: ALLOWED_TYPES,
    });
  } else {
    const existing = data.allowed_mime_types ?? [];
    const missing = ALLOWED_TYPES.filter((t) => !existing.includes(t));
    if (missing.length > 0) {
      await supabase.storage.updateBucket(BUCKET, {
        public: true,
        allowedMimeTypes: [...existing, ...missing],
      });
    }
  }
}

export async function uploadFile(file: File, path: string): Promise<string> {
  await ensureBucket();
  const supabase = await createServiceClient();

  const { error } = await supabase.storage
    .from(BUCKET)
    .upload(path, file, { upsert: true, contentType: file.type });

  if (error) throw new Error(error.message);

  const { data } = supabase.storage.from(BUCKET).getPublicUrl(path);
  return data.publicUrl;
}

export async function deleteFile(path: string): Promise<void> {
  const supabase = await createServiceClient();
  await supabase.storage.from(BUCKET).remove([path]);
}

export function pathFromUrl(url: string): string | null {
  const marker = `/storage/v1/object/public/${BUCKET}/`;
  const idx = url.indexOf(marker);
  if (idx === -1) return null;
  return decodeURIComponent(url.slice(idx + marker.length));
}
