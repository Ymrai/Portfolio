import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { MoreProjectForm } from "@/components/admin/more-project-form";
import { getMoreProjectByIdAdmin } from "@/lib/supabase/queries";
import { requireAdminPage } from "@/lib/auth/require-admin";

export const metadata: Metadata = { title: "Edit Project" };
export const dynamic = "force-dynamic";

export default async function EditMoreProjectPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireAdminPage();
  const { id } = await params;
  const project = await getMoreProjectByIdAdmin(id);

  if (!project) notFound();

  return <MoreProjectForm project={project} />;
}
