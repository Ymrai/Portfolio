import type { Metadata } from "next";
import { MoreProjectForm } from "@/components/admin/more-project-form";

export const metadata: Metadata = { title: "New Project" };

export default function NewMoreProjectPage() {
  return <MoreProjectForm />;
}
