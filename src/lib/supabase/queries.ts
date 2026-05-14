import { createClient, createServiceClient } from "./server";
import type {
  PortfolioInfo,
  Project,
  MoreProject,
  AboutMe,
} from "@/types";

export async function getPortfolioInfo(): Promise<PortfolioInfo | null> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("portfolio_info")
    .select("*")
    .eq("id", 1)
    .single();
  return data;
}

export async function getPublishedProjects(): Promise<Project[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("projects")
    .select("*")
    .eq("status", "published")
    .order("order_index", { ascending: true });
  return data ?? [];
}

export async function getFeaturedProjects(): Promise<Project[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("projects")
    .select("*")
    .eq("status", "published")
    .eq("featured", true)
    .order("order_index", { ascending: true });
  return data ?? [];
}

export async function getAllProjects(): Promise<Project[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("projects")
    .select("*")
    .order("order_index", { ascending: true });
  return data ?? [];
}

export async function getProjectBySlug(
  slug: string
): Promise<Project | null> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("projects")
    .select("*")
    .eq("slug", slug)
    .single();
  return data;
}

export async function getProjectById(id: string): Promise<Project | null> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("projects")
    .select("*")
    .eq("id", id)
    .single();
  return data;
}

export async function getPublishedMoreProjects(): Promise<MoreProject[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("more_projects")
    .select("*")
    .eq("status", "published")
    .order("order_index", { ascending: true });
  return data ?? [];
}

export async function getAllMoreProjects(): Promise<MoreProject[]> {
  // Use service role so RLS doesn't filter out draft projects in the admin.
  // The public-facing query (getPublishedMoreProjects) uses the anon client
  // and remains correctly restricted to published rows.
  const supabase = await createServiceClient();
  const { data } = await supabase
    .from("more_projects")
    .select("*")
    .order("order_index", { ascending: true });
  return data ?? [];
}

export async function getMoreProjectBySlug(
  slug: string
): Promise<MoreProject | null> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("more_projects")
    .select("*")
    .eq("slug", slug)
    .single();
  return data;
}

export async function getMoreProjectById(
  id: string
): Promise<MoreProject | null> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("more_projects")
    .select("*")
    .eq("id", id)
    .single();
  return data;
}

// Admin version — uses service role to bypass RLS so drafts are accessible.
export async function getMoreProjectByIdAdmin(
  id: string
): Promise<MoreProject | null> {
  const supabase = await createServiceClient();
  const { data } = await supabase
    .from("more_projects")
    .select("*")
    .eq("id", id)
    .single();
  return data;
}

export async function getAdjacentProjects(
  currentSlug: string
): Promise<{ prev: Project | null; next: Project | null }> {
  const projects = await getPublishedProjects();
  if (projects.length <= 1) return { prev: null, next: null };
  const idx = projects.findIndex((p) => p.slug === currentSlug);
  return {
    // Wrap around: first project's prev = last, last project's next = first
    prev: projects[(idx - 1 + projects.length) % projects.length],
    next: projects[(idx + 1) % projects.length],
  };
}

export async function getAdjacentMoreProjects(
  currentSlugOrId: string
): Promise<{ prev: MoreProject | null; next: MoreProject | null }> {
  const projects = await getPublishedMoreProjects();
  if (projects.length <= 1) return { prev: null, next: null };
  const idx = projects.findIndex(
    (p) => p.slug === currentSlugOrId || p.id === currentSlugOrId
  );
  const last = projects.length - 1;
  return {
    prev: projects[idx > 0 ? idx - 1 : last],
    next: projects[idx < last ? idx + 1 : 0],
  };
}

export async function getAboutMe(): Promise<AboutMe | null> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("about_me")
    .select("*")
    .eq("id", 1)
    .single();
  return data;
}
