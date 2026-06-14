import type { Metadata } from "next";
import { ProjectForm } from "@/components/admin/project-form";
import { requireAdminPage } from "@/lib/auth/require-admin";

export const metadata: Metadata = { title: "New Project" };

export default async function NewProjectPage() {
  await requireAdminPage();
  return <ProjectForm />;
}
