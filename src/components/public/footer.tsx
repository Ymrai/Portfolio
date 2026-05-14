import Link from "next/link";
import { ArrowUpRight } from "@phosphor-icons/react/dist/ssr";
import { getPortfolioInfo } from "@/lib/supabase/queries";

const navLinks = [
  { label: "Projects", href: "/" },
  { label: "More", href: "/more-projects" },
  { label: "About Me", href: "/about" },
];

const FOOTER_BG = "#333B50";
const WHITE = "#FFFFFF";
const MUTED = "#A0A8BC";

export async function Footer() {
  const info = await getPortfolioInfo();

  return (
    <footer className="mt-auto" style={{ backgroundColor: FOOTER_BG }}>
      <div className="max-w-7xl mx-auto px-6 pt-14 pb-8">
        {/* Top block */}
        <div className="flex items-start justify-between gap-8">
          <div>
            <h2 className="text-2xl font-bold" style={{ color: WHITE }}>
              {info?.footer_title || "Let's Connect"}
            </h2>
            <p className="mt-2 text-base whitespace-nowrap" style={{ color: MUTED }}>
              {info?.footer_subtitle || "Let's talk projects, collaborations or anything design!"}
            </p>
          </div>
          <nav className="flex flex-col gap-2.5">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="flex items-center gap-1 text-base transition-opacity hover:opacity-80 group"
                style={{ color: WHITE }}
              >
                <ArrowUpRight
                  size={14}
                  style={{ color: WHITE }}
                />
                {link.label}
              </Link>
            ))}
          </nav>
        </div>

        {/* Separator */}
        <div className="my-8" style={{ borderTop: `1px solid ${MUTED}33` }} />

        {/* Bottom block */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-base">
          <p style={{ color: MUTED }}>
            Copyright {new Date().getFullYear()} by {info?.name ?? "Yael Rosenberg"}
          </p>
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
            {info?.email && (
              <a
                href={`mailto:${info.email}`}
                className="text-base transition-opacity hover:opacity-80"
                style={{ color: WHITE }}
              >
                {info.email}
              </a>
            )}
            {info?.resume_url && (
              <a
                href={info.resume_url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-base transition-opacity hover:opacity-80"
                style={{ color: WHITE }}
              >
                Resume
              </a>
            )}
            {info?.linkedin_url && (
              <a
                href={info.linkedin_url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-base transition-opacity hover:opacity-80"
                style={{ color: WHITE }}
              >
                LinkedIn
              </a>
            )}
          </div>
        </div>
      </div>

      {/* Brand bottom border */}
      <div style={{ height: "8px", backgroundColor: "#D6009D" }} />
    </footer>
  );
}
