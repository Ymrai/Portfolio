"use server";

import { createServiceClient } from "@/lib/supabase/server";
import { z } from "zod";

const experienceSchema = z.object({
  company: z.string(),
  role: z.string(),
  start_date: z.string(),
  end_date: z.string().nullable(),
  description: z.string(),
});

const educationSchema = z.object({
  institution: z.string(),
  degree: z.string(),
  field: z.string(),
  graduation_year: z.number(),
});

const schema = z.object({
  bio: z.string().optional(),
  skills: z.array(z.string()),
  experience: z.array(experienceSchema),
  education: z.array(educationSchema),
  interests: z.array(z.string()),
});

export async function saveAboutMe(
  data: z.infer<typeof schema>
): Promise<{ error?: string }> {
  const parsed = schema.safeParse(data);
  if (!parsed.success)
    return { error: parsed.error.issues[0]?.message ?? "Validation failed" };

  const supabase = await createServiceClient();
  const { error } = await supabase
    .from("about_me")
    .update({
      bio: parsed.data.bio ?? null,
      skills: parsed.data.skills,
      interests: parsed.data.interests,
      experience: parsed.data.experience as unknown as import("@/types/database").Json,
      education: parsed.data.education as unknown as import("@/types/database").Json,
    })
    .eq("id", 1);

  return { error: error?.message };
}
