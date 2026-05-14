"use server";

import { revalidatePath } from "next/cache";
import { createServiceClient } from "@/lib/supabase/server";
import { z } from "zod";
import type { Json } from "@/types/database";

// ── Sections schema (mirrors projects.ts — title optional for more-projects) ──

const sectionBlockSchema = z.object({
  id: z.string(),
  type: z.enum(["text", "image", "slider"]),
  images: z.array(z.object({
    id: z.string(),
    url: z.string(),
    alt: z.string().optional(),
  })).optional(),
  layout: z.enum(["single", "two-column"]).optional(),
  content: z.string().optional(),
  content_right: z.string().optional(),
  column_right_type: z.enum(["text", "image"]).optional(),
  column_right_image_url: z.string().optional(),
  column_order: z.enum(["text-left", "image-left"]).optional(),
  url: z.string().optional(),
  alt: z.string().optional(),
});

const sectionSchema = z.object({
  id: z.string(),
  caption: z.string().optional(),
  caption_color: z.string().optional(),
  title: z.string().optional(), // optional — sections can be block-only with no header
  subtitle: z.string().optional(),
  blocks: z.array(sectionBlockSchema),
});

// ── Main schema ───────────────────────────────────────────────────────────────

const moreProjectSchema = z.object({
  title: z.string().min(1, "Title is required"),
  slug: z.string().min(1, "Slug is required"),
  description: z.string().optional(),
  industry: z.string().optional(),
  kind: z.string().optional(),
  tech_stack: z.array(z.string()),
  cover_image_url: z.string().optional(),
  gallery_images: z.array(z.string()),
  sections: z.array(sectionSchema).optional(),
  live_url: z.string().url().optional().or(z.literal("")),
  github_url: z.string().url().optional().or(z.literal("")),
  order_index: z.number(),
  status: z.enum(["draft", "published"]),
});

export type MoreProjectFormData = z.infer<typeof moreProjectSchema>;

export async function reorderMoreProjects(
  items: { id: string; order_index: number }[]
): Promise<{ error?: string }> {
  const supabase = await createServiceClient();
  const results = await Promise.all(
    items.map(({ id, order_index }) =>
      supabase.from("more_projects").update({ order_index }).eq("id", id)
    )
  );
  const failed = results.find((r) => r.error);
  return { error: failed?.error?.message };
}

export async function createMoreProject(
  data: MoreProjectFormData
): Promise<{ id?: string; error?: string }> {
  const parsed = moreProjectSchema.safeParse(data);
  if (!parsed.success)
    return { error: parsed.error.issues[0]?.message ?? "Validation failed" };

  const supabase = await createServiceClient();

  // Auto-assign order_index so new projects go to the end of the list.
  const { data: maxRow } = await supabase
    .from("more_projects")
    .select("order_index")
    .order("order_index", { ascending: false })
    .limit(1)
    .single();
  const nextIndex = (maxRow?.order_index ?? -1) + 1;

  const baseSlug = parsed.data.slug;

  // Retry with an incrementing suffix on slug uniqueness conflicts.
  // attempt 0 → original slug, attempt 1 → slug-1, attempt 2 → slug-2 …
  for (let attempt = 0; attempt < 10; attempt++) {
    const slug = attempt === 0 ? baseSlug : `${baseSlug}-${attempt}`;
    const { data: row, error } = await supabase
      .from("more_projects")
      .insert({
        ...parsed.data,
        slug,
        order_index: nextIndex,
        sections: (parsed.data.sections ?? null) as Json | null,
      })
      .select("id")
      .single();

    if (!error) {
      revalidatePath("/admin/more-projects");
      revalidatePath("/more-projects");
      return { id: row.id };
    }

    // Postgres unique-violation code is 23505. Only retry for the slug column.
    const isSlugConflict =
      error.code === "23505" &&
      error.message.includes("more_projects_slug_key");
    if (!isSlugConflict) return { error: error.message };
  }

  return {
    error:
      "Could not generate a unique slug. Please set the slug field manually.",
  };
}

export async function updateMoreProject(
  id: string,
  data: MoreProjectFormData
): Promise<{ error?: string }> {
  const parsed = moreProjectSchema.safeParse(data);
  if (!parsed.success)
    return { error: parsed.error.issues[0]?.message ?? "Validation failed" };

  const supabase = await createServiceClient();
  const { error } = await supabase
    .from("more_projects")
    .update({
      ...parsed.data,
      sections: (parsed.data.sections ?? null) as Json | null,
    })
    .eq("id", id);

  revalidatePath("/admin/more-projects");
  revalidatePath(`/admin/more-projects/${id}`);
  revalidatePath("/more-projects");
  revalidatePath(`/more-projects/${id}`);
  return { error: error?.message };
}

export async function deleteMoreProject(
  id: string
): Promise<{ error?: string }> {
  const supabase = await createServiceClient();
  const { error } = await supabase.from("more_projects").delete().eq("id", id);
  revalidatePath("/admin/more-projects");
  revalidatePath("/more-projects");
  return { error: error?.message };
}

export async function getMoreProject(
  id: string
): Promise<{ project?: any; error?: string }> {
  const supabase = await createServiceClient();
  const { data, error } = await supabase
    .from("more_projects")
    .select("*")
    .eq("id", id)
    .single();
  if (error) return { error: error.message };
  return { project: data };
}
