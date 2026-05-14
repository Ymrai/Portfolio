"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  DndContext,
  closestCenter,
  PointerSensor,
  KeyboardSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
  arrayMove,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { GripVertical, Pencil, Trash2 } from "lucide-react";
import { reorderMoreProjects, deleteMoreProject } from "@/app/actions/more-projects";
import { toast } from "sonner";
import type { MoreProject } from "@/types";

// ── Delete confirmation dialog ────────────────────────────────────────────────

function DeleteDialog({
  project,
  open,
  onOpenChange,
  onDeleted,
}: {
  project: MoreProject;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onDeleted: (id: string) => void;
}) {
  const [isPending, startTransition] = useTransition();

  function handleDelete() {
    startTransition(async () => {
      const { error } = await deleteMoreProject(project.id);
      if (error) {
        toast.error(error);
      } else {
        toast.success(`"${project.title}" deleted`);
        onOpenChange(false);
        onDeleted(project.id);
      }
    });
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Delete &ldquo;{project.title}&rdquo;?</DialogTitle>
        </DialogHeader>
        <p className="text-sm text-muted-foreground">
          This action cannot be undone.
        </p>
        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isPending}
          >
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={handleDelete}
            disabled={isPending}
          >
            {isPending ? "Deleting…" : "Delete"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ── Single sortable row ───────────────────────────────────────────────────────

function SortableRow({
  project,
  onDeleteClick,
}: {
  project: MoreProject;
  onDeleteClick: (project: MoreProject) => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: project.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 10 : undefined,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="flex items-center gap-3 p-4 bg-background hover:bg-muted/30 transition-colors border-b border-border last:border-b-0"
    >
      {/* Drag handle */}
      <button
        type="button"
        {...attributes}
        {...listeners}
        suppressHydrationWarning
        className="cursor-grab active:cursor-grabbing text-muted-foreground hover:text-foreground touch-none shrink-0 p-0.5 rounded"
        aria-label="Drag to reorder"
      >
        <GripVertical className="h-4 w-4" />
      </button>

      {project.cover_image_url && (
        <img
          src={project.cover_image_url}
          alt={project.title}
          className="w-14 h-10 object-cover rounded-md shrink-0"
        />
      )}

      <div className="flex-1 min-w-0">
        <p className="font-medium truncate">{project.title}</p>
        <div className="flex items-center gap-2 mt-0.5">
          {project.industry && (
            <span className="text-xs text-muted-foreground">{project.industry}</span>
          )}
          {project.kind && (
            <span className="text-xs text-muted-foreground">· {project.kind}</span>
          )}
        </div>
      </div>

      <div className="flex items-center gap-2 shrink-0">
        <Badge
          variant={project.status === "published" ? "default" : "outline"}
          className="text-xs"
        >
          {project.status}
        </Badge>
        <Link
          href={`/admin/more-projects/${project.id}`}
          className={buttonVariants({ variant: "ghost", size: "icon" })}
        >
          <Pencil className="h-3.5 w-3.5" />
        </Link>
        <Button
          variant="ghost"
          size="icon"
          className="text-muted-foreground hover:text-destructive hover:bg-destructive/10"
          onClick={() => onDeleteClick(project)}
          aria-label={`Delete ${project.title}`}
        >
          <Trash2 className="h-3.5 w-3.5" />
        </Button>
      </div>
    </div>
  );
}

// ── Sortable list ─────────────────────────────────────────────────────────────

export function SortableMoreProjectList({ initial }: { initial: MoreProject[] }) {
  const router = useRouter();
  const [projects, setProjects] = useState(initial);
  const [isPending, startTransition] = useTransition();
  const [toDelete, setToDelete] = useState<MoreProject | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = projects.findIndex((p) => p.id === active.id);
    const newIndex = projects.findIndex((p) => p.id === over.id);
    const reordered = arrayMove(projects, oldIndex, newIndex);

    // Optimistic update
    setProjects(reordered);

    // Persist to DB
    startTransition(async () => {
      const items = reordered.map((p, i) => ({ id: p.id, order_index: i }));
      const { error } = await reorderMoreProjects(items);
      if (error) {
        toast.error("Failed to save order");
        setProjects(projects); // revert on error
      } else {
        toast.success("Order saved");
      }
    });
  }

  function handleDeleted(id: string) {
    setProjects((prev) => prev.filter((p) => p.id !== id));
    router.refresh();
  }

  return (
    <>
      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext items={projects.map((p) => p.id)} strategy={verticalListSortingStrategy}>
          <div className={`rounded-lg border divide-y divide-border overflow-hidden ${isPending ? "opacity-70" : ""}`}>
            {projects.map((project) => (
              <SortableRow
                key={project.id}
                project={project}
                onDeleteClick={setToDelete}
              />
            ))}
          </div>
        </SortableContext>
      </DndContext>

      {toDelete && (
        <DeleteDialog
          project={toDelete}
          open={!!toDelete}
          onOpenChange={(open) => { if (!open) setToDelete(null); }}
          onDeleted={handleDeleted}
        />
      )}
    </>
  );
}
