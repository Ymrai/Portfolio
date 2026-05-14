import type { Metadata } from "next";
import { getPublishedMoreProjects, getPortfolioInfo } from "@/lib/supabase/queries";
import { MoreProjectCard } from "@/components/public/more-project-card";
import { FadeIn, FadeInGroup, FadeInItem } from "@/components/public/fade-in";

export const metadata: Metadata = { title: "More Projects" };
export const dynamic = "force-dynamic";

export default async function MoreProjectsPage() {
  const [projects, info] = await Promise.all([
    getPublishedMoreProjects(),
    getPortfolioInfo(),
  ]);

  const pageTitle = info?.more_page_title || "More Projects";
  const pageSubtitle = info?.more_page_subtitle || "Branding, print & concept projects";
  const pageDescription = info?.more_page_description || "A broader selection of work across visual design,\nbranding and print.";

  return (
    <div className="max-w-7xl mx-auto px-6 pt-8 pb-32">
      <FadeIn>
        <div className="mb-14">
          <div className="w-10 h-[3px] bg-primary rounded-full mb-4" />
          <h1 className="text-3xl font-bold">{pageTitle}</h1>
          <p className="text-base font-semibold mt-2">{pageSubtitle}</p>
          <p className="mt-1" style={{ fontSize: "16px", color: "var(--secondary-body)" }}>
            {pageDescription.split("\n").map((line, i, arr) => (
              <span key={i}>{line}{i < arr.length - 1 && <br />}</span>
            ))}
          </p>
        </div>
      </FadeIn>

      {projects.length === 0 ? (
        <p className="text-muted-foreground py-12 text-center">
          No projects published yet.
        </p>
      ) : (
        <FadeInGroup className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          {projects.map((project) => (
            <FadeInItem key={project.id}>
              <MoreProjectCard project={project} />
            </FadeInItem>
          ))}
        </FadeInGroup>
      )}
    </div>
  );
}
