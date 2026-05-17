import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import {
  getMoreProjectBySlug,
  getMoreProjectById,
  getAdjacentMoreProjects,
} from "@/lib/supabase/queries";
import { FadeIn } from "@/components/public/fade-in";
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
    <article className="max-w-7xl mx-auto px-4 md:px-6 pt-8 md:pt-20 pb-16 md:pb-32">

      {/* ── Header ── */}
      <FadeIn>
        <header className="max-w-5xl space-y-4 mb-12">
          {project.industry && (
            <p className="font-semibold uppercase tracking-widest text-primary" style={{ fontSize: "16px" }}>
              {project.industry}
            </p>
          )}
          <h1 className="text-2xl md:text-4xl lg:text-5xl font-extrabold tracking-tight leading-[1.2]">
            {project.title}
          </h1>
          {project.kind && (
            <p className="font-medium text-muted-foreground text-base md:text-xl">
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
      {/* Each section has its own FadeIn so whileInView fires per-section */}
      {sections.length > 0 && (
        <div className="max-w-5xl space-y-16">
          {sections.map((section) => (
            <FadeIn key={section.id}>
              <DynamicSectionRenderer section={section} />
            </FadeIn>
          ))}
        </div>
      )}

      {/* ── Bottom navigation ── */}
      <div className="mt-16 md:mt-24 pt-8 border-t border-border/60 flex items-center justify-between gap-3">
        {adjacent.prev ? (
          <Link
            href={`/more-projects/${adjacent.prev.slug ?? adjacent.prev.id}`}
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
            href={`/more-projects/${adjacent.next.slug ?? adjacent.next.id}`}
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
