import { getPortfolioInfo, getPublishedProjects } from "@/lib/supabase/queries";
import { ProjectCard } from "@/components/public/project-card";
import { FadeIn, FadeInGroup, FadeInItem } from "@/components/public/fade-in";
import { ScrollArrow } from "@/components/public/scroll-arrow";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const [info, projects] = await Promise.all([
    getPortfolioInfo(),
    getPublishedProjects(),
  ]);

  const name = info?.name ?? "Yael Rosenberg";

  // Intro text: use DB value if set, else hardcoded 3-line default.
  // Newlines in stored text produce <br /> breaks at render time.
  const defaultIntro = `Hi, I'm ${name}, a senior product designer\nturning complex systems into clear, intuitive\nand scalable experiences.`;
  const introText = info?.home_intro_text || defaultIntro;
  const introLines = introText.split("\n");

  function renderIntroLine(line: string) {
    const nIdx = name ? line.indexOf(name) : -1;
    if (nIdx < 0) return <>{line}</>;
    const after = line.slice(nIdx + name.length);
    // Include the comma immediately after the name in the colored span
    const trailingComma = after.startsWith(",") ? "," : "";
    return (
      <>
        {line.slice(0, nIdx)}
        <span style={{ color: "#D6009D" }}>{name}{trailingComma}</span>
        {after.slice(trailingComma.length)}
      </>
    );
  }

  const caseStudiesTitle = info?.home_case_studies_title || "Case Studies";
  const caseStudiesSubtitle = info?.home_case_studies_subtitle || "Selected end-to-end product work";
  const caseStudiesDescription = info?.home_case_studies_description || "Deep dives into complex systems, from discovery and strategy through delivered design.";

  return (
    <div>
      {/* Hero — full viewport, content centered as one block */}
      <section className="min-h-screen flex flex-col items-center justify-center px-6 text-center">
        <div className="max-w-7xl w-full mx-auto flex flex-col items-center">
          <FadeIn>
            <h1 className="text-[3.25rem] font-semibold leading-[1.3] tracking-tight text-center">
              {introLines.map((line, i) => (
                <span key={i}>
                  {renderIntroLine(line)}
                  {i < introLines.length - 1 && <br />}
                </span>
              ))}
            </h1>
          </FadeIn>

          {info?.tagline && (
            <FadeIn delay={0.15}>
              <p className="mt-6 text-center" style={{ fontSize: "22px" }}>
                {info.tagline}
              </p>
            </FadeIn>
          )}

          {/* Scroll arrow — part of the centered content block */}
          <div className="mt-16">
            <ScrollArrow targetId="case-studies" />
          </div>
        </div>
      </section>

      {/* Case Studies — no top padding; scroll arrow offsets by 112px to match other pages */}
      <section id="case-studies" className="max-w-7xl mx-auto px-6 pb-32">
        <FadeIn>
          <div className="mb-12">
            <div className="w-10 h-[3px] bg-primary rounded-full mb-4" />
            <h2 className="text-3xl font-bold">{caseStudiesTitle}</h2>
            <p className="text-base font-semibold mt-2">{caseStudiesSubtitle}</p>
            <p className="mt-1 max-w-md" style={{ fontSize: "16px", color: "var(--secondary-body)" }}>
              {caseStudiesDescription}
            </p>
          </div>
        </FadeIn>

        {projects.length === 0 ? (
          <p className="text-muted-foreground py-12 text-center">
            No case studies published yet.
          </p>
        ) : (
          <FadeInGroup className="space-y-16">
            {projects.map((project, i) => (
              <FadeInItem key={project.id}>
                <ProjectCard project={project} index={i} />
              </FadeInItem>
            ))}
          </FadeInGroup>
        )}
      </section>
    </div>
  );
}
