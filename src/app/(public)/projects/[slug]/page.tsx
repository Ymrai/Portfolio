import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { getProjectBySlug, getAdjacentProjects } from "@/lib/supabase/queries";
import { CaseStudySection } from "@/components/public/case-study-section";
import { DynamicSectionRenderer } from "@/components/public/dynamic-section";
import { ImageGallery } from "@/components/public/image-gallery";
import { FadeIn } from "@/components/public/fade-in";
import { CASE_STUDY_SECTIONS, parseCaseStudy, parseSections } from "@/types";
import { ArrowLeft, ArrowRight } from "@phosphor-icons/react/dist/ssr";
import { ScrollToTopButton } from "@/components/public/scroll-to-top";
import { SnapshotTable } from "@/components/public/snapshot-table";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const project = await getProjectBySlug(slug);
  if (!project) return {};
  return {
    title: project.title,
    description: project.description ?? undefined,
  };
}

export default async function ProjectPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const [project, adjacent] = await Promise.all([
    getProjectBySlug(slug),
    getAdjacentProjects(slug),
  ]);

  if (!project || project.status !== "published") notFound();

  const caseStudy = parseCaseStudy(project.case_study);
  const dynamicSections = parseSections(project.sections);
  const useDynamic = dynamicSections.length > 0;

  const snapshotRows = [
    { label: "Client",   value: project.client },
    { label: "Industry", value: project.industry },
    { label: "Category", value: project.category },
    { label: "Role",     value: project.role },
    { label: "Team",     value: project.team },
    { label: "Duration", value: project.duration },
  ].filter((r): r is { label: string; value: string } => Boolean(r.value));

  return (
    <article className="max-w-7xl mx-auto px-4 md:px-6 pt-8 md:pt-20 pb-16 md:pb-32">

      {/* ── Hero image — full article width ── */}
      {project.hero_image_url && (
        <FadeIn>
          <div
            className="w-full rounded-2xl overflow-hidden p-4 sm:p-8 md:p-12"
            style={{
              backgroundColor: project.hero_bg_color || project.card_bg_color || "#F5F5F0",
            }}
          >
            <img
              src={project.hero_image_url}
              alt={`${project.title} hero`}
              style={{
                width: "100%",
                height: "auto",
                objectFit: "contain",
                display: "block",
                borderRadius: "8px",
              }}
            />
          </div>
        </FadeIn>
      )}

      {/* ── Title — text-centered across the full article width ── */}
      <FadeIn>
        <div className="text-center pt-10 pb-8 md:pt-24 md:pb-12">
          <h1 className="text-xl sm:text-2xl md:text-4xl lg:text-5xl font-extrabold tracking-tight leading-[1.2]">
            {(project.case_study_title || project.title)
              .split("\n")
              .map((line, i, arr) => (
                <span key={i}>
                  {line}
                  {i < arr.length - 1 && <br />}
                </span>
              ))}
          </h1>
          <div className="flex flex-wrap justify-center gap-2 mt-5 mb-5">
            {project.tech_stack.slice(1).map((tech) => (
              <span
                key={tech}
                className="text-xs font-medium bg-secondary text-secondary-foreground rounded-full px-3 py-1"
              >
                {tech}
              </span>
            ))}
          </div>
          <div className="flex items-center justify-center gap-3 pt-1">
            {project.live_url && (
              <a
                href={project.live_url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm font-medium border border-primary text-brand-text rounded-full px-5 py-2 hover:bg-primary hover:text-primary-foreground transition-all duration-200"
              >
                Live Site
              </a>
            )}
            {project.github_url && (
              <a
                href={project.github_url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm font-medium border border-border rounded-full px-5 py-2 hover:border-foreground transition-colors"
              >
                Source
              </a>
            )}
          </div>
        </div>
      </FadeIn>

      {/* ── Snapshot table — full article width ── */}
      {snapshotRows.length > 0 && (
        <FadeIn delay={0.1}>
          <SnapshotTable rows={snapshotRows} />
        </FadeIn>
      )}

      {/* ── Left-aligned container: all body content ── */}
      {/* Images inside DynamicSectionRenderer break out to full article width */}
      {/* Each section gets its own FadeIn so whileInView fires per-section
          rather than waiting for 5% of the entire (potentially very tall) group */}
      <div className="max-w-5xl space-y-16">

        {useDynamic
          ? dynamicSections.map((section) => (
              <FadeIn key={section.id}>
                <DynamicSectionRenderer section={section} />
              </FadeIn>
            ))
          : CASE_STUDY_SECTIONS.map(({ key, label }) => {
              const section = caseStudy[key];
              if (!section.text && section.images.length === 0) return null;
              return (
                <FadeIn key={key}>
                  <CaseStudySection label={label} section={section} />
                </FadeIn>
              );
            })}

        {/* Gallery */}
        {project.gallery_images.length > 0 && (
          <FadeIn>
            <h2 className="text-xl font-bold mb-6">Gallery</h2>
            <ImageGallery images={project.gallery_images} title={project.title} />
          </FadeIn>
        )}

      </div>

      {/* ── Bottom navigation — carousel ── */}
      <div className="mt-16 md:mt-24 pt-8 border-t border-border/60 flex items-center justify-between gap-3">
        {adjacent.prev ? (
          <Link
            href={`/projects/${adjacent.prev.slug}`}
            className="flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground border border-border/60 rounded-full px-4 py-2.5 hover:border-foreground/40 transition-all duration-200 min-w-0"
          >
            <ArrowLeft size={15} className="shrink-0" />
            <span className="truncate max-w-[80px] sm:max-w-[180px]">{adjacent.prev.title}</span>
          </Link>
        ) : (
          <div />
        )}

        <ScrollToTopButton />

        {adjacent.next ? (
          <Link
            href={`/projects/${adjacent.next.slug}`}
            className="flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground border border-border/60 rounded-full px-4 py-2.5 hover:border-foreground/40 transition-all duration-200 min-w-0"
          >
            <span className="truncate max-w-[80px] sm:max-w-[180px]">{adjacent.next.title}</span>
            <ArrowRight size={15} className="shrink-0" />
          </Link>
        ) : (
          <div />
        )}
      </div>

    </article>
  );
}
