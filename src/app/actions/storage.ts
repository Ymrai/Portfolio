"use server";

import { uploadFile, deleteFile, pathFromUrl } from "@/lib/supabase/storage";

export async function uploadImageAction(
  formData: FormData
): Promise<{ url: string; error?: string }> {
  const file = formData.get("file") as File;
  const folder = (formData.get("folder") as string) || "misc";

  if (!file || file.size === 0) return { url: "", error: "No file selected" };

  const ext = file.name.split(".").pop() ?? "jpg";
  const uniqueName = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
  const path = `${folder}/${uniqueName}`;

  try {
    const url = await uploadFile(file, path);
    return { url };
  } catch (e) {
    return { url: "", error: e instanceof Error ? e.message : "Upload failed" };
  }
}

export async function uploadPdfAction(
  formData: FormData
): Promise<{ url: string; error?: string }> {
  const file = formData.get("file") as File;
  const folder = (formData.get("folder") as string) || "resumes";

  if (!file || file.size === 0) return { url: "", error: "No file selected" };
  if (file.type !== "application/pdf" && !file.name.endsWith(".pdf")) {
    return { url: "", error: "Only PDF files are allowed" };
  }

  const uniqueName = `${Date.now()}-${Math.random().toString(36).slice(2)}.pdf`;
  const path = `${folder}/${uniqueName}`;

  try {
    const url = await uploadFile(file, path);
    return { url };
  } catch (e) {
    return { url: "", error: e instanceof Error ? e.message : "Upload failed" };
  }
}

export async function deleteImageAction(
  url: string
): Promise<{ error?: string }> {
  const path = pathFromUrl(url);
  if (!path) return { error: "Could not determine file path" };
  try {
    await deleteFile(path);
    return {};
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Delete failed" };
  }
}
