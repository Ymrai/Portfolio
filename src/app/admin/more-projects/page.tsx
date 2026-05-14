import type { Metadata } from "next";
import Link from "next/link";
import { getAllMoreProjects } from "@/lib/supabase/queries";
import { buttonVariants } from "@/components/ui/button";
import { SortableMoreProjectList } from "@/components/admin/sortable-more-project-list";
import { Plus } from "lucide-react";
import { cn } from "@/lib/utils";

export const metadata: Metadata = { title: "More Projects" };
export const dynamic = "force-dynamic";

export default async function AdminMoreProjectsPage() {
  const projects = await getAllMoreProjects();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">More Projects</h1>
          {projects.length > 1 && (
            <p className="text-xs text-muted-foreground mt-1">
              Drag rows to reorder — order is reflected on the public page.
            </p>
          )}
        </div>
        <Link href="/admin/more-projects/new" className={buttonVariants()}>
          <Plus className="h-4 w-4 mr-1" />
          New Project
        </Link>
      </div>

      {projects.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <p className="text-muted-foreground text-sm">No projects yet.</p>
          <Link
            href="/admin/more-projects/new"
            className={cn(buttonVariants({ variant: "outline" }), "mt-4")}
          >
            Add your first project
          </Link>
        </div>
      ) : (
        <SortableMoreProjectList initial={projects} />
      )}
    </div>
  );
}
