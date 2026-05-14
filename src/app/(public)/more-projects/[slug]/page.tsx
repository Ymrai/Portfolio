import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import {
  getMoreProjectBySlug,
  getMoreProjectById,
  getAdjacentMoreProjects,
} from "@/lib/supabase/queries";
import { FadeIn, FadeInGroup, FadeInItem } from "@/components/public/fade-in";
import { DynamicSectionRenderer } from "@/components/public/dynamic-section";
import { ArrowLeft, ArrowRight } from "@phosphor-icons/react/dist/ssr";
import { ScrollToTopButton } from "@/components/public/scroll-to-top";
import { parseSections } from "@/types";
import { renderInline } from "@/lib/render-inline";

export const dynamic = "force-dynamic";

async function getProject(slug: string) {
  const bySlug = await getMoreProjectBySlug(slug);
  if (bySlug) return bySlug;
  return getMoreProjectById(slug);
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const project = await getProject(slug);
  if (!project) return {};
  return {
    title: project.title,
    description: project.description ?? undefined,
  };
}

export default async function MoreProjectPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const [project, adjacent] = await Promise.all([
    getProject(slug),
    getAdjacentMoreProjects(slug),
  ]);

  if (!project || project.status !== "published") notFound();

  const sections = parseSections(project.sections);

  return (
    <article className="max-w-7xl mx-auto px-6 pt-20 pb-32">

      {/* ── Header ── */}
      <FadeIn>
        <header className="max-w-5xl space-y-4 mb-12">
          {project.industry && (
            <p className="font-semibold uppercase tracking-widest text-primary" style={{ fontSize: "16px" }}>
              {project.industry}
            </p>
          )}
          <h1 className="font-extrabold tracking-tight leading-[1.1]" style={{ fontSize: "48px" }}>
            {project.title}
          </h1>
          {project.kind && (
            <p className="font-medium text-muted-foreground" style={{ fontSize: "20px" }}>
              {project.kind}
            </p>
          )}
          {project.description && (
            <p
              className="text-lg leading-relaxed pt-1"
              style={{ color: "var(--secondary-body)" }}
            >
              {renderInline(project.description)}
            </p>
          )}
          {project.tech_stack.length > 0 && (
            <div className="flex flex-wrap gap-2 pt-1">
              {project.tech_stack.map((tech) => (
                <span
                  key={tech}
                  className="text-base font-medium bg-secondary text-secondary-foreground rounded-full px-3 py-1"
                >
                  {tech}
                </span>
              ))}
            </div>
          )}
          <div className="flex items-center gap-3 pt-1">
            {project.live_url && (
              <a
                href={project.live_url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm font-medium border border-primary text-primary rounded-full px-5 py-2 hover:bg-primary hover:text-white transition-all duration-200"
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
        </header>
      </FadeIn>

      {/* ── Cover image — full article width ── */}
      {project.cover_image_url && (
        <FadeIn delay={0.1}>
          <div className="w-full rounded-2xl overflow-hidden border bg-muted mb-16">
            <img
              src={project.cover_image_url}
              alt={project.title}
              className="w-full h-full object-cover"
            />
          </div>
        </FadeIn>
      )}

      {/* ── Dynamic sections ── */}
      {/* Images inside DynamicSectionRenderer break out to full article width */}
      {sections.length > 0 && (
        <div className="max-w-5xl">
          <FadeInGroup className="space-y-16">
            {sections.map((section) => (
              <FadeInItem key={section.id}>
                <DynamicSectionRenderer section={section} />
              </FadeInItem>
            ))}
          </FadeInGroup>
        </div>
      )}

      {/* ── Bottom navigation — always shown, wraps at ends ── */}
      <div className="mt-24 pt-8 border-t border-border/60 flex items-center justify-between gap-4">
        {adjacent.prev && (
          <Link
            href={`/more-projects/${adjacent.prev.slug ?? adjacent.prev.id}`}
            className="flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground border border-border/60 rounded-full px-5 py-2.5 hover:border-foreground/40 transition-all duration-200"
          >
            <ArrowLeft size={15} />
            {adjacent.prev.title}
          </Link>
        )}

        <ScrollToTopButton />

        {adjacent.next && (
          <Link
            href={`/more-projects/${adjacent.next.slug ?? adjacent.next.id}`}
            className="flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground border border-border/60 rounded-full px-5 py-2.5 hover:border-foreground/40 transition-all duration-200"
          >
            {adjacent.next.title}
            <ArrowRight size={15} />
          </Link>
        )}
      </div>
    </article>
  );
}
