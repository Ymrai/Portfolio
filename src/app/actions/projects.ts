"use server";

import { createServiceClient } from "@/lib/supabase/server";
import { z } from "zod";
import type { Json } from "@/types/database";

const caseSectionSchema = z.object({
  text: z.string(),
  images: z.array(z.string()),
});

const caseStudySchema = z.object({
  context: caseSectionSchema,
  problem_statement: caseSectionSchema,
  constraints: caseSectionSchema,
  responsibilities: caseSectionSchema,
  key_decisions: caseSectionSchema,
  outcome: caseSectionSchema,
  learning: caseSectionSchema,
});

const projectSchema = z.object({
  title: z.string().min(1, "Title is required"),
  slug: z.string().min(1, "Slug is required"),
  company: z.string().optional(),
  case_study_title: z.string().optional(),
  client: z.string().optional(),
  industry: z.string().optional(),
  category: z.string().optional(),
  role: z.string().optional(),
  team: z.string().optional(),
  duration: z.string().optional(),
  card_bg_color: z.string().optional(),
  hero_bg_color: z.string().optional(),
  hero_image_url: z.string().optional(),
  description: z.string().optional(),
  long_description: z.string().optional(),
  tech_stack: z.array(z.string()),
  live_url: z.string().url().optional().or(z.literal("")),
  github_url: z.string().url().optional().or(z.literal("")),
  image_url: z.string().optional(),
  gallery_images: z.array(z.string()),
  case_study: caseStudySchema.optional(),
  sections: z.array(z.object({
    id: z.string(),
    caption: z.string().optional(),
    caption_color: z.string().optional(),
    title: z.string(),
    subtitle: z.string().optional(),
    blocks: z.array(z.object({
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
    })),
  })).optional(),
  featured: z.boolean(),
  order_index: z.number(),
  status: z.enum(["draft", "published"]),
});

export type ProjectFormData = z.infer<typeof projectSchema>;

export async function createProject(
  data: ProjectFormData
): Promise<{ id?: string; error?: string }> {
  const parsed = projectSchema.safeParse(data);
  if (!parsed.success)
    return { error: parsed.error.issues[0]?.message ?? "Validation failed" };

  const supabase = await createServiceClient();

  // Auto-assign order_index as max + 1 so new projects appear at the end
  const { data: maxRow } = await supabase
    .from("projects")
    .select("order_index")
    .order("order_index", { ascending: false })
    .limit(1)
    .single();
  const nextIndex = (maxRow?.order_index ?? -1) + 1;

  const { data: row, error } = await supabase
    .from("projects")
    .insert({
      ...parsed.data,
      order_index: nextIndex,
      case_study: (parsed.data.case_study ?? null) as Json | null,
    })
    .select("id")
    .single();

  if (error) return { error: error.message };
  return { id: row.id };
}

export async function reorderProjects(
  items: { id: string; order_index: number }[]
): Promise<{ error?: string }> {
  const supabase = await createServiceClient();
  const results = await Promise.all(
    items.map(({ id, order_index }) =>
      supabase.from("projects").update({ order_index }).eq("id", id)
    )
  );
  const failed = results.find((r) => r.error);
  return { error: failed?.error?.message };
}

export async function updateProject(
  id: string,
  data: ProjectFormData
): Promise<{ error?: string }> {
  const parsed = projectSchema.safeParse(data);
  if (!parsed.success)
    return { error: parsed.error.issues[0]?.message ?? "Validation failed" };

  const supabase = await createServiceClient();
  const { error } = await supabase
    .from("projects")
    .update({
      ...parsed.data,
      case_study: (parsed.data.case_study ?? null) as Json | null,
    })
    .eq("id", id);

  return { error: error?.message };
}

export async function deleteProject(id: string): Promise<{ error?: string }> {
  const supabase = await createServiceClient();
  const { error } = await supabase.from("projects").delete().eq("id", id);
  return { error: error?.message };
}
