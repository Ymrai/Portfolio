import type { Metadata } from "next";
import { MoreProjectForm } from "@/components/admin/more-project-form";
import { requireAdminPage } from "@/lib/auth/require-admin";

export const metadata: Metadata = { title: "New Project" };

export default async function NewMoreProjectPage() {
  await requireAdminPage();
  return <MoreProjectForm />;
}
