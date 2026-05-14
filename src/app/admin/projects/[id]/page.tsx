import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getProjectById } from "@/lib/supabase/queries";
import { ProjectForm } from "@/components/admin/project-form";

export const metadata: Metadata = { title: "Edit Project" };
export const dynamic = "force-dynamic";

export default async function EditProjectPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const project = await getProjectById(id);
  if (!project) notFound();

  return <ProjectForm project={project} />;
}
