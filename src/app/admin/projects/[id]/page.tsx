import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getProjectByIdAdmin } from "@/lib/supabase/queries";
import { ProjectForm } from "@/components/admin/project-form";
import { requireAdminPage } from "@/lib/auth/require-admin";

export const metadata: Metadata = { title: "Edit Project" };
export const dynamic = "force-dynamic";

export default async function EditProjectPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireAdminPage();
  const { id } = await params;
  const project = await getProjectByIdAdmin(id);
  if (!project) notFound();

  return <ProjectForm project={project} />;
}
