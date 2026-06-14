import { createClient } from "./client";

const BUCKET = "portfolio-assets";

export async function uploadFileClient(
  file: File,
  folder: string
): Promise<{ url: string; error?: string }> {
  const supabase = createClient();
  const ext = file.name.split(".").pop() ?? "bin";
  const uniqueName = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
  const path = `${folder}/${uniqueName}`;

  // upsert:false → plain INSERT. The filename is unique per upload, so it can never
  // collide; this avoids the storage UPDATE/upsert RLS path that the anon role is
  // denied (anon may INSERT new objects but not upsert). Superseded files are removed
  // server-side by reconcile-on-save.
  const { error } = await supabase.storage
    .from(BUCKET)
    .upload(path, file, { upsert: false, contentType: file.type });

  if (error) return { url: "", error: error.message };

  const { data } = supabase.storage.from(BUCKET).getPublicUrl(path);
  return { url: data.publicUrl };
}

export async function deleteFileClient(url: string): Promise<void> {
  const supabase = createClient();
  const marker = `/storage/v1/object/public/${BUCKET}/`;
  const idx = url.indexOf(marker);
  if (idx === -1) return;
  const path = decodeURIComponent(url.slice(idx + marker.length));
  await supabase.storage.from(BUCKET).remove([path]);
}
