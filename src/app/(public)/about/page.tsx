import type { Metadata } from "next";
import { getAboutMe, getPortfolioInfo } from "@/lib/supabase/queries";
import { FadeIn } from "@/components/public/fade-in";
import { ArrowUpRight } from "@phosphor-icons/react/dist/ssr";

export const metadata: Metadata = { title: "About Me" };
export const dynamic = "force-dynamic";

export default async function AboutPage() {
  const [about, info] = await Promise.all([getAboutMe(), getPortfolioInfo()]);

  const name = info?.name ?? "";
  const bioParagraphs = about?.bio ? about.bio.split("\n").filter(Boolean) : [];

  return (
    <div className="max-w-7xl mx-auto px-6 pt-8 pb-32">
      {/* Heading + subtitle sit above the bio/portrait grid */}
      <FadeIn>
        <div className="mb-10">
          <div className="w-10 h-[3px] bg-primary rounded-full mb-4" />
          <h1 className="text-3xl font-bold">{info?.about_page_title || "About me"}</h1>
          <p className="font-semibold mt-3" style={{ fontSize: "16px" }}>
            {info?.about_page_subtitle || "Designing clarity for complex products"}
          </p>
        </div>
      </FadeIn>

      {/* Bio + portrait grid — portrait aligns with first line of bio */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-12 md:gap-16 items-start">
        {/* Bio column */}
        <FadeIn className="md:col-span-3">
          {bioParagraphs.length > 0 ? (
            <div className="space-y-4 leading-relaxed" style={{ fontSize: "20px" }}>
              {bioParagraphs.map((para, i) => {
                if (i === 0) {
                  const nameIdx = name ? para.indexOf(name) : -1;
                  return (
                    <p key={i} className="font-bold">
                      {nameIdx >= 0 ? (
                        <>
                          {para.slice(0, nameIdx)}
                          <span style={{ color: "#D6009D" }}>{name}</span>
                          {para.slice(nameIdx + name.length)}
                        </>
                      ) : (
                        para
                      )}
                    </p>
                  );
                }
                return (
                  <p key={i} style={{ color: "var(--secondary-body)" }}>
                    {para}
                  </p>
                );
              })}
            </div>
          ) : (
            <p style={{ color: "var(--secondary-body)", fontSize: "20px" }} className="leading-relaxed">
              Senior Product Designer with 10+ years of experience designing
              complex B2B products end to end.
            </p>
          )}

          {info?.resume_url && (
            <a
              href={info.resume_url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 border border-primary text-primary rounded-full px-6 py-2.5 text-sm font-medium hover:bg-primary hover:text-white transition-all duration-200 mt-6"
            >
              View Resume
              <ArrowUpRight size={15} />
            </a>
          )}
        </FadeIn>

        {/* Portrait column — top-aligned with bio text */}
        <FadeIn delay={0.15} className="md:col-span-2 flex justify-center md:justify-end">
          {info?.avatar_url ? (
            <div className="w-64 h-64 md:w-72 md:h-72 rounded-full overflow-hidden shrink-0 border-4 border-primary/10">
              <img
                src={info.avatar_url}
                alt={info.name}
                className="w-full h-full object-cover"
              />
            </div>
          ) : (
            <div className="w-64 h-64 md:w-72 md:h-72 rounded-full bg-muted shrink-0" />
          )}
        </FadeIn>
      </div>
    </div>
  );
}
