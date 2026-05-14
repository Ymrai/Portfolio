"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { TagInput } from "./tag-input";
import { ImageUpload } from "./image-upload";
import { SectionsEditor } from "./sections-editor";
import {
  createMoreProject,
  updateMoreProject,
  deleteMoreProject,
} from "@/app/actions/more-projects";
import { slugify } from "@/lib/slugify";
import { parseSections, type DynamicSection } from "@/types";
import type { MoreProject } from "@/types";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";

interface MoreProjectFormProps {
  project?: MoreProject;
}

export function MoreProjectForm({ project }: MoreProjectFormProps) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [confirmDelete, setConfirmDelete] = useState(false);

  const [title, setTitle] = useState(project?.title ?? "");
  const [slug, setSlug] = useState(project?.slug ?? "");
  const [description, setDescription] = useState(project?.description ?? "");
  const [industry, setIndustry] = useState(project?.industry ?? "");
  const [kind, setKind] = useState(project?.kind ?? "");
  const [techStack, setTechStack] = useState<string[]>(project?.tech_stack ?? []);
  const [liveUrl, setLiveUrl] = useState(project?.live_url ?? "");
  const [githubUrl, setGithubUrl] = useState(project?.github_url ?? "");
  const [coverImageUrl, setCoverImageUrl] = useState(project?.cover_image_url ?? "");
  const [sections, setSections] = useState<DynamicSection[]>(
    parseSections(project?.sections)
  );
  const [orderIndex, setOrderIndex] = useState(project?.order_index ?? 0);
  const [status, setStatus] = useState<"draft" | "published">(
    project?.status ?? "draft"
  );

  function handleTitleChange(val: string) {
    setTitle(val);
    if (!project) setSlug(slugify(val));
  }

  function formData() {
    return {
      title,
      slug,
      description: description || undefined,
      industry: industry || undefined,
      kind: kind || undefined,
      tech_stack: techStack,
      cover_image_url: coverImageUrl || undefined,
      gallery_images: [] as string[], // retained in schema for backward compat
      sections: sections.length > 0 ? sections : undefined,
      live_url: liveUrl || undefined,
      github_url: githubUrl || undefined,
      order_index: orderIndex,
      status,
    };
  }

  function handleSave() {
    startTransition(async () => {
      if (project) {
        const { error } = await updateMoreProject(project.id, formData());
        if (error) { toast.error(error); return; }
        toast.success("Project saved");
      } else {
        const { id, error } = await createMoreProject(formData());
        if (error || !id) { toast.error(error ?? "Failed to create"); return; }
        toast.success("Project created");
        router.push(`/admin/more-projects/${id}`);
      }
    });
  }

  function handleDelete() {
    startTransition(async () => {
      const { error } = await deleteMoreProject(project!.id);
      if (error) { toast.error(error); return; }
      toast.success("Project deleted");
      router.push("/admin/more-projects");
    });
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">
          {project ? "Edit Project" : "New Project"}
        </h1>
        <div className="flex gap-2">
          {project && (
            <Button
              variant="destructive"
              size="sm"
              onClick={() => setConfirmDelete(true)}
              disabled={pending}
            >
              Delete
            </Button>
          )}
          <Button onClick={handleSave} disabled={pending}>
            {pending ? "Saving…" : project ? "Save Changes" : "Create Project"}
          </Button>
        </div>
      </div>

      <Tabs defaultValue="details">
        <TabsList>
          <TabsTrigger value="details">Details</TabsTrigger>
          <TabsTrigger value="images">Cover Image</TabsTrigger>
          <TabsTrigger value="sections">Sections</TabsTrigger>
        </TabsList>

        {/* ── Details ─────────────────────────────── */}
        <TabsContent value="details" className="space-y-5 pt-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label>Title *</Label>
              <Input
                value={title}
                onChange={(e) => handleTitleChange(e.target.value)}
                placeholder="Project name"
              />
            </div>
            <div className="space-y-1.5">
              <Label>Slug *</Label>
              <Input
                value={slug}
                onChange={(e) => setSlug(slugify(e.target.value))}
                placeholder="project-name"
              />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label>Industry</Label>
              <Input
                value={industry}
                onChange={(e) => setIndustry(e.target.value)}
                placeholder="e.g. Healthcare, Fintech…"
              />
            </div>
            <div className="space-y-1.5">
              <Label>Kind / Subject</Label>
              <Input
                value={kind}
                onChange={(e) => setKind(e.target.value)}
                placeholder="e.g. Branding, Dashboard, Mobile App…"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label>Description</Label>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Short description of this project…"
              rows={3}
            />
          </div>

          <div className="space-y-1.5">
            <Label>Tech Stack</Label>
            <TagInput
              value={techStack}
              onChange={setTechStack}
              placeholder="React, Figma, Python… (Enter to add)"
            />
          </div>

          <Separator />

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label>Live URL</Label>
              <Input
                value={liveUrl}
                onChange={(e) => setLiveUrl(e.target.value)}
                placeholder="https://…"
              />
            </div>
            <div className="space-y-1.5">
              <Label>GitHub URL</Label>
              <Input
                value={githubUrl}
                onChange={(e) => setGithubUrl(e.target.value)}
                placeholder="https://github.com/…"
              />
            </div>
          </div>

          <Separator />

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label>Status</Label>
              <Select
                value={status}
                onValueChange={(v) => setStatus(v as "draft" | "published")}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="draft">Draft</SelectItem>
                  <SelectItem value="published">Published</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Order Index</Label>
              <Input
                type="number"
                value={orderIndex}
                onChange={(e) => setOrderIndex(Number(e.target.value))}
              />
            </div>
          </div>
        </TabsContent>

        {/* ── Cover Image ──────────────────────────── */}
        <TabsContent value="images" className="space-y-6 pt-4">
          <div className="space-y-2">
            <Label>Cover Image</Label>
            <p className="text-xs text-muted-foreground">
              Displayed on project cards and at the top of the project page.
            </p>
            <ImageUpload
              value={coverImageUrl}
              onChange={setCoverImageUrl}
              folder={`more-projects/${project?.id ?? "new"}/cover`}
              aspectRatio="video"
              label="Upload cover image"
            />
          </div>
        </TabsContent>

        {/* ── Sections ─────────────────────────────── */}
        <TabsContent value="sections" className="pt-4">
          <p className="text-sm text-muted-foreground mb-4">
            Build the project page by adding sections. Caption, title, and
            subtitle are all optional — sections can start directly with content
            blocks.
          </p>
          <SectionsEditor
            value={sections}
            onChange={setSections}
            projectId={project?.id}
          />
        </TabsContent>
      </Tabs>

      {/* Bottom save — always visible without scrolling back to the top */}
      <div className="flex justify-end pt-2 border-t border-border">
        <Button onClick={handleSave} disabled={pending} size="lg">
          {pending ? "Saving…" : project ? "Save Changes" : "Create Project"}
        </Button>
      </div>

      <Dialog open={confirmDelete} onOpenChange={setConfirmDelete}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete &ldquo;{title}&rdquo;?</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            This action cannot be undone.
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmDelete(false)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={pending}
            >
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
