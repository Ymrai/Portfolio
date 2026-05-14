"use server";

import { createServiceClient } from "@/lib/supabase/server";
import { z } from "zod";

const schema = z.object({
  name: z.string().min(1, "Name is required"),
  tagline: z.string().optional(),
  bio_short: z.string().optional(),
  email: z.string().email().optional().or(z.literal("")),
  github_url: z.string().url().optional().or(z.literal("")),
  linkedin_url: z.string().url().optional().or(z.literal("")),
  resume_url: z.string().url().optional().or(z.literal("")),
  avatar_url: z.string().optional(),
  home_intro_text: z.string().optional(),
  home_case_studies_title: z.string().optional(),
  home_case_studies_subtitle: z.string().optional(),
  home_case_studies_description: z.string().optional(),
  more_page_title: z.string().optional(),
  more_page_subtitle: z.string().optional(),
  more_page_description: z.string().optional(),
  about_page_title: z.string().optional(),
  about_page_subtitle: z.string().optional(),
  footer_title: z.string().optional(),
  footer_subtitle: z.string().optional(),
});

export async function savePortfolioInfo(
  data: z.infer<typeof schema>
): Promise<{ error?: string }> {
  const parsed = schema.safeParse(data);
  if (!parsed.success)
    return { error: parsed.error.issues[0]?.message ?? "Validation failed" };

  const supabase = await createServiceClient();
  const { error } = await supabase
    .from("portfolio_info")
    .update(parsed.data)
    .eq("id", 1);

  return { error: error?.message };
}
