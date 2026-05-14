"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { TagInput } from "./tag-input";
import { ImageUpload } from "./image-upload";
import { GalleryUpload } from "./gallery-upload";
import { SectionsEditor } from "./sections-editor";
import { createProject, updateProject, deleteProject } from "@/app/actions/projects";
import { slugify } from "@/lib/slugify";
import {
  emptyCaseStudy,
  parseCaseStudy,
  parseSections,
  type CaseStudy,
  type DynamicSection,
  type Project,
} from "@/types";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";

interface ProjectFormProps {
  project?: Project;
}

export function ProjectForm({ project }: ProjectFormProps) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [confirmDelete, setConfirmDelete] = useState(false);

  const [title, setTitle] = useState(project?.title ?? "");
  const [slug, setSlug] = useState(project?.slug ?? "");
  const [company, setCompany] = useState(project?.company ?? "");
  const [caseStudyTitle, setCaseStudyTitle] = useState(project?.case_study_title ?? "");
  const [client, setClient] = useState(project?.client ?? "");
  const [industry, setIndustry] = useState(project?.industry ?? "");
  const [category, setCategory] = useState(project?.category ?? "");
  const [role, setRole] = useState(project?.role ?? "");
  const [team, setTeam] = useState(project?.team ?? "");
  const [duration, setDuration] = useState(project?.duration ?? "");
  const [cardBgColor, setCardBgColor] = useState(project?.card_bg_color ?? "#F5F0EB");
  const [heroBgColor, setHeroBgColor] = useState(project?.hero_bg_color ?? "#F5F5F0");
  const [description, setDescription] = useState(project?.description ?? "");
  const [techStack, setTechStack] = useState<string[]>(project?.tech_stack ?? []);
  const [liveUrl, setLiveUrl] = useState(project?.live_url ?? "");
  const [githubUrl, setGithubUrl] = useState(project?.github_url ?? "");
  const [imageUrl, setImageUrl] = useState(project?.image_url ?? "");
  const [heroImageUrl, setHeroImageUrl] = useState(project?.hero_image_url ?? "");
  const [galleryImages, setGalleryImages] = useState<string[]>(project?.gallery_images ?? []);
  const [caseStudy, setCaseStudy] = useState<CaseStudy>(
    parseCaseStudy(project?.case_study)
  );
  const [sections, setSections] = useState<DynamicSection[]>(
    parseSections(project?.sections)
  );
  const [featured, setFeatured] = useState(project?.featured ?? false);
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
      company: company || undefined,
      case_study_title: caseStudyTitle || undefined,
      client: client || undefined,
      industry: industry || undefined,
      category: category || undefined,
      role: role || undefined,
      team: team || undefined,
      duration: duration || undefined,
      card_bg_color: cardBgColor || undefined,
      hero_bg_color: heroBgColor || undefined,
      hero_image_url: heroImageUrl || undefined,
      description: description || undefined,
      long_description: undefined,
      tech_stack: techStack,
      live_url: liveUrl || undefined,
      github_url: githubUrl || undefined,
      image_url: imageUrl || undefined,
      gallery_images: galleryImages,
      case_study: caseStudy,
      sections: sections.length > 0 ? sections : undefined,
      featured,
      order_index: orderIndex,
      status,
    };
  }

  function handleSave() {
    startTransition(async () => {
      if (project) {
        const { error } = await updateProject(project.id, formData());
        if (error) { toast.error(error); return; }
        toast.success("Project saved");
      } else {
        const { id, error } = await createProject(formData());
        if (error || !id) { toast.error(error ?? "Failed to create"); return; }
        toast.success("Project created");
        router.push(`/admin/projects/${id}`);
      }
    });
  }

  function handleDelete() {
    startTransition(async () => {
      const { error } = await deleteProject(project!.id);
      if (error) { toast.error(error); return; }
      toast.success("Project deleted");
      router.push("/admin/projects");
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

      <Tabs defaultValue="overview">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="links">Links & Stack</TabsTrigger>
          <TabsTrigger value="images">Images</TabsTrigger>
          <TabsTrigger value="case-study">Case Study</TabsTrigger>
        </TabsList>

        {/* ── Overview ─────────────────────────────────── */}
        <TabsContent value="overview" className="space-y-5 pt-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label>Title *</Label>
              <Input
                value={title}
                onChange={(e) => handleTitleChange(e.target.value)}
                placeholder="My Awesome Project"
              />
            </div>
            <div className="space-y-1.5">
              <Label>Slug *</Label>
              <Input
                value={slug}
                onChange={(e) => setSlug(slugify(e.target.value))}
                placeholder="my-awesome-project"
              />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label>Company</Label>
              <Input
                value={company}
                onChange={(e) => setCompany(e.target.value)}
                placeholder="Acme Corp"
              />
              <p className="text-xs text-muted-foreground">
                Shown above the title on cards and the case study page in brand color.
              </p>
            </div>
            <div className="space-y-1.5">
              <Label>Card Background Color</Label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={cardBgColor}
                  onChange={(e) => setCardBgColor(e.target.value)}
                  className="h-9 w-12 cursor-pointer rounded border border-input bg-transparent p-0.5"
                />
                <Input
                  value={cardBgColor}
                  onChange={(e) => setCardBgColor(e.target.value)}
                  placeholder="#F5F0EB"
                  className="font-mono"
                />
              </div>
              <p className="text-xs text-muted-foreground">
                Background color of this project&apos;s card on the homepage.
              </p>
              <div
                className="h-6 rounded border border-border/60 text-xs flex items-center justify-center text-muted-foreground"
                style={{ backgroundColor: cardBgColor }}
              >
                preview
              </div>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label>Short Description</Label>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="A brief summary shown on cards and in the project header…"
              rows={3}
            />
          </div>

          <Separator />

          {/* Case Study Page Fields */}
          <div className="space-y-1.5">
            <Label>Case Study Title</Label>
            <Textarea
              value={caseStudyTitle}
              onChange={(e) => setCaseStudyTitle(e.target.value)}
              placeholder="Leave blank to use the main project title"
              rows={3}
              className="resize-y"
            />
            <p className="text-xs text-muted-foreground">
              Shown as the large heading on the case study page. Each new line becomes a line break. Falls back to the project title if empty.
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label>Client</Label>
              <Input
                value={client}
                onChange={(e) => setClient(e.target.value)}
                placeholder="Acme Corp"
              />
            </div>
            <div className="space-y-1.5">
              <Label>Industry</Label>
              <Input
                value={industry}
                onChange={(e) => setIndustry(e.target.value)}
                placeholder="FinTech, Healthcare…"
              />
            </div>
            <div className="space-y-1.5">
              <Label>Category</Label>
              <Input
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                placeholder="B2B SaaS, Mobile App…"
              />
            </div>
            <div className="space-y-1.5">
              <Label>Role</Label>
              <Input
                value={role}
                onChange={(e) => setRole(e.target.value)}
                placeholder="Lead Product Designer"
              />
            </div>
            <div className="space-y-1.5">
              <Label>Team</Label>
              <Input
                value={team}
                onChange={(e) => setTeam(e.target.value)}
                placeholder="2 designers, 4 engineers"
              />
            </div>
            <div className="space-y-1.5">
              <Label>Duration</Label>
              <Input
                value={duration}
                onChange={(e) => setDuration(e.target.value)}
                placeholder="6 months"
              />
            </div>
          </div>

          <Separator />

          <div className="grid gap-4 sm:grid-cols-3">
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
            <div className="flex items-center gap-3 pt-6">
              <Switch
                checked={featured}
                onCheckedChange={setFeatured}
                id="featured"
              />
              <Label htmlFor="featured">Featured on homepage</Label>
            </div>
          </div>
        </TabsContent>

        {/* ── Links & Stack ──────────────────────────── */}
        <TabsContent value="links" className="space-y-5 pt-4">
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
          <div className="space-y-1.5">
            <Label>Tech Stack</Label>
            <TagInput
              value={techStack}
              onChange={setTechStack}
              placeholder="React, TypeScript, Supabase… (Enter to add)"
            />
          </div>
        </TabsContent>

        {/* ── Images ────────────────────────────────── */}
        <TabsContent value="images" className="space-y-6 pt-4">
          <div className="space-y-2">
            <Label>Cover / Thumbnail Image</Label>
            <p className="text-xs text-muted-foreground">
              Displayed on the homepage project card.
            </p>
            <ImageUpload
              value={imageUrl}
              onChange={setImageUrl}
              folder={`projects/${project?.id ?? "new"}/cover`}
              aspectRatio="video"
              label="Upload cover image"
            />
          </div>
          <Separator />
          <div className="space-y-2">
            <Label>Hero Image</Label>
            <p className="text-xs text-muted-foreground">
              Full-width image displayed at the very top of the case study page.
            </p>
            <ImageUpload
              value={heroImageUrl}
              onChange={setHeroImageUrl}
              folder={`projects/${project?.id ?? "new"}/hero`}
              aspectRatio="video"
              label="Upload hero image"
            />
          </div>
          <Separator />
          <div className="space-y-1.5">
            <Label>Hero Background Color</Label>
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={heroBgColor}
                onChange={(e) => setHeroBgColor(e.target.value)}
                className="h-9 w-12 cursor-pointer rounded border border-input bg-transparent p-0.5"
              />
              <Input
                value={heroBgColor}
                onChange={(e) => setHeroBgColor(e.target.value)}
                placeholder="#F5F5F0"
                className="font-mono"
              />
            </div>
            <p className="text-xs text-muted-foreground">
              Background behind the hero image on the case study page. Falls back to Card Background Color if not set.
            </p>
            <div
              className="h-6 rounded border border-border/60 text-xs flex items-center justify-center text-muted-foreground"
              style={{ backgroundColor: heroBgColor }}
            >
              preview
            </div>
          </div>
          <Separator />
          <div className="space-y-2">
            <Label>Gallery</Label>
            <p className="text-xs text-muted-foreground">
              Additional images shown in the gallery section of the project page.
            </p>
            <GalleryUpload
              value={galleryImages}
              onChange={setGalleryImages}
              folder={`projects/${project?.id ?? "new"}/gallery`}
            />
          </div>
        </TabsContent>

        {/* ── Case Study ────────────────────────────── */}
        <TabsContent value="case-study" className="pt-4">
          <p className="text-sm text-muted-foreground mb-6">
            Build the case study by adding sections with custom titles. Each
            section can contain any number of text and image blocks in any
            order.
          </p>
          <SectionsEditor
            value={sections}
            onChange={setSections}
            projectId={project?.id}
          />
        </TabsContent>
      </Tabs>

      {/* Delete confirm dialog */}
      <Dialog open={confirmDelete} onOpenChange={setConfirmDelete}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete &ldquo;{title}&rdquo;?</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            This action cannot be undone. The project and all its data will be
            permanently deleted.
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
