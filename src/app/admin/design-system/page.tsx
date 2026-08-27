import type { Metadata } from "next";
import { requireAdminPage } from "@/lib/auth/require-admin";

export const metadata: Metadata = { title: "Design System" };

interface SwatchProps {
  hex: string;
  label: string;
  note?: string;
  border?: boolean;
}

function Swatch({ hex, label, note, border }: SwatchProps) {
  return (
    <div className="flex items-center gap-3">
      <div
        className="w-10 h-10 rounded-md shrink-0"
        style={{
          backgroundColor: hex,
          border: border ? "1px solid #e5e5e5" : undefined,
        }}
      />
      <div>
        <p className="text-sm font-medium">{label}</p>
        <p className="text-xs text-muted-foreground font-mono">{hex}</p>
        {note && <p className="text-xs text-muted-foreground">{note}</p>}
      </div>
    </div>
  );
}

interface TypeSpecimenProps {
  label: string;
  size: string;
  weight: string;
  lineHeight?: string;
  sample: string;
  usage: string;
}

function TypeSpecimen({ label, size, weight, lineHeight, sample, usage }: TypeSpecimenProps) {
  return (
    <div className="flex flex-col gap-1 py-3 border-b border-border last:border-0">
      <div className="flex items-baseline justify-between gap-4 flex-wrap">
        <span
          style={{
            fontSize: size,
            fontWeight: weight,
            lineHeight: lineHeight ?? "normal",
          }}
        >
          {sample}
        </span>
        <span className="text-xs text-muted-foreground shrink-0">{label}</span>
      </div>
      <p className="text-xs text-muted-foreground font-mono">
        {size} / {weight}{lineHeight ? ` / lh ${lineHeight}` : ""}
        <span className="ml-3 not-italic font-sans">— {usage}</span>
      </p>
    </div>
  );
}

interface SpacingRowProps {
  label: string;
  value: string;
  usage: string;
}

function SpacingRow({ label, value, usage }: SpacingRowProps) {
  const px = parseFloat(value) * 16;
  return (
    <div className="flex items-center gap-4 py-2 border-b border-border last:border-0">
      <div className="w-24 shrink-0 bg-primary/20 rounded" style={{ height: "12px", width: `${Math.min(px, 200)}px` }} />
      <div className="flex gap-6 text-sm flex-wrap">
        <span className="font-medium w-20 shrink-0">{label}</span>
        <span className="font-mono text-muted-foreground w-24 shrink-0">{value} ({px}px)</span>
        <span className="text-muted-foreground">{usage}</span>
      </div>
    </div>
  );
}

interface MotionRowProps {
  token: string;
  ms: string;
  usage: string;
}

function MotionRow({ token, ms, usage }: MotionRowProps) {
  return (
    <div className="flex items-center gap-4 py-2 border-b border-border last:border-0">
      <span className="font-mono text-sm w-36 shrink-0">{token}</span>
      <span className="font-mono text-xs text-muted-foreground w-16 shrink-0">{ms}</span>
      <span className="text-sm text-muted-foreground">{usage}</span>
    </div>
  );
}

/* Live preview of the shared card hover. Production drives the lift with
   Framer Motion (`whileHover={{ y: -4 }}`); this reproduces the same values in
   pure CSS so the page stays a Server Component. Same 4px, same 300ms, same
   easing — hover it to feel what a card should do. */
function CardHoverPreview() {
  return (
    <div className="group w-full max-w-[260px] rounded-2xl overflow-hidden border border-border/60 bg-card shadow-sm transition-all duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] hover:shadow-lg hover:-translate-y-1">
      <div className="relative h-28 overflow-hidden bg-muted">
        <div className="absolute inset-4 flex items-center justify-center rounded-lg bg-primary/15 transition-transform duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:scale-[1.03]">
          <span className="text-xs text-muted-foreground">thumbnail</span>
        </div>
      </div>
      <div className="px-4 py-3">
        <p className="text-[11px] font-semibold uppercase tracking-widest" style={{ color: "var(--brand-text)" }}>
          Hover me
        </p>
        <p className="text-sm font-semibold leading-snug">Card hover preview</p>
      </div>
    </div>
  );
}

export default async function DesignSystemPage() {
  await requireAdminPage();
  return (
    <div className="max-w-3xl space-y-12 pb-16">
      <div>
        <h1 className="text-2xl font-bold">Design System</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Read-only reference for colors, typography, spacing, and motion used across the site.
        </p>
      </div>

      {/* ── Colors ── */}
      <section className="space-y-6">
        <h2 className="text-lg font-semibold border-b border-border pb-2">Colors</h2>

        <div>
          <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3">Brand</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Swatch hex="#D6009D" label="Brand / Primary" note="Logo, active nav, highlights, buttons, accent bars" />
            <Swatch hex="#ffffff" label="Primary Foreground" note="Text on brand-colored backgrounds" border />
          </div>
        </div>

        <div>
          <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3">Light Mode</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Swatch hex="#ffffff" label="Background" note="Page background" border />
            <Swatch hex="#f9f9f9" label="Sidebar" note="Admin sidebar background" border />
            <Swatch hex="#f5f5f5" label="Muted / Secondary" note="Card backgrounds, input fills" border />
            <Swatch hex="#202020" label="Foreground" note="Primary body text" />
            <Swatch hex="#5B5B5B" label="Secondary Body" note="Descriptions, captions (--secondary-body)" />
            <Swatch hex="#757575" label="Muted Foreground" note="Placeholder text, timestamps" />
            <Swatch hex="#e5e5e5" label="Border / Input" note="Dividers, input borders" border />
          </div>
        </div>

        <div>
          <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3">Dark Mode</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-4 rounded-lg" style={{ backgroundColor: "#252B3B" }}>
            <Swatch hex="#252B3B" label="Background" note="Page background" border />
            <Swatch hex="#2E3548" label="Card / Surface" note="Cards, popover, sidebar" />
            <Swatch hex="#333B50" label="Secondary / Footer" note="Footer bg, secondary surfaces" />
            <Swatch hex="#ffffff" label="Foreground" note="Primary text" />
            <Swatch hex="#A0A8BC" label="Secondary Body / Muted" note="Descriptions, captions (--secondary-body)" />
            <Swatch hex="#3D4560" label="Border / Input" note="Dividers, input borders" />
          </div>
        </div>

        <div>
          <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3">Footer (always dark)</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-4 rounded-lg" style={{ backgroundColor: "#333B50" }}>
            <Swatch hex="#333B50" label="Footer Background" note="Never changes between modes" />
            <Swatch hex="#ffffff" label="Title, nav links, contact links" note="High-emphasis text" />
            <Swatch hex="#A0A8BC" label="Subtitle, copyright, icons" note="Low-emphasis text" />
            <Swatch hex="#D6009D" label="Bottom border" note="8px brand accent at footer base" />
          </div>
        </div>
      </section>

      {/* ── Typography ── */}
      <section className="space-y-4">
        <h2 className="text-lg font-semibold border-b border-border pb-2">Typography</h2>
        <div className="text-sm text-muted-foreground space-y-1">
          <p><span className="font-medium text-foreground">Font family:</span> Manrope (Google Fonts)</p>
          <p><span className="font-medium text-foreground">Weights loaded:</span> 300, 400, 500, 600, 700, 800</p>
        </div>
        <div className="mt-4">
          <TypeSpecimen label="Hero / Intro" size="44px" weight="600" lineHeight="1.3" sample="Hi, I'm Yael Rosenberg" usage="Home page hero heading" />
          <TypeSpecimen label="Page Title (H1)" size="30px" weight="700" sample="Case Studies" usage="Section headers, page titles" />
          <TypeSpecimen label="More Project Title (H1)" size="48px" weight="800" lineHeight="1.1" sample="Project Name" usage="More Projects detail page h1" />
          <TypeSpecimen label="Section Subtitle / Tagline" size="16px" weight="600" sample="Designing clarity for complex products" usage="About Me page subtitle; was 18px (text-lg)" />
          <TypeSpecimen label="Nav / Footer Title" size="24px" weight="700" sample="Let's Connect" usage="Footer heading" />
          <TypeSpecimen label="More Project Card Title" size="24px" weight="600" sample="Project Title · Kind" usage="More Projects card title + kind text" />
          <TypeSpecimen label="Industry / Caption Label" size="16px" weight="600" sample="PRODUCT DESIGN" usage="Industry tag on More Project card & detail page header; section labels in case studies — uppercase + tracking-widest" />
          <TypeSpecimen label="More Project Detail — Kind" size="20px" weight="500" sample="Mobile App" usage="kind/subject line below h1 on More Projects detail page" />
          <TypeSpecimen label="Body / Description" size="20px" weight="400" sample="Turning complex systems into clear experiences." usage="Intro/description on More Project detail pages; About Me body paragraphs; was 16px" />
          <TypeSpecimen label="Body — Bold" size="20px" weight="700" sample="I'm Yael Rosenberg, senior product designer." usage="First bio paragraph on About Me" />
          <TypeSpecimen label="Chips / Tags" size="16px" weight="500" sample="Figma  •  React  •  TypeScript" usage="Tech stack chips on detail pages (text-base); was text-sm" />
          <TypeSpecimen label="Small / Label" size="14px" weight="500" sample="View case study" usage="Nav links, buttons, captions" />
          <TypeSpecimen label="Caption / Meta" size="12px" weight="400" sample="BRANDING • VISUAL DESIGN" usage="Project kind labels, admin meta" />
        </div>
      </section>

      {/* ── Spacing ── */}
      <section className="space-y-4">
        <h2 className="text-lg font-semibold border-b border-border pb-2">Spacing</h2>
        <div>
          <SpacingRow label="px-6" value="1.5rem" usage="Horizontal page padding" />
          <SpacingRow label="pt-20" value="5rem" usage="Top padding below fixed nav (80px)" />
          <SpacingRow label="pb-32" value="8rem" usage="Bottom section padding" />
          <SpacingRow label="pb-24" value="6rem" usage="Hero section bottom padding" />
          <SpacingRow label="mb-12" value="3rem" usage="Space below section header block" />
          <SpacingRow label="gap-6" value="1.5rem" usage="Card grid gap" />
          <SpacingRow label="gap-12" value="3rem" usage="About Me bio / portrait column gap" />
          <SpacingRow label="mt-6" value="1.5rem" usage="Tagline spacing below hero, button spacing" />
          <SpacingRow label="max-w-5xl" value="64rem" usage="Page content max-width (1024px)" />
        </div>
      </section>

      {/* ── Dark Mode Behavior ── */}
      {/* ── Motion ── */}
      <section className="space-y-6">
        <h2 className="text-lg font-semibold border-b border-border pb-2">Motion</h2>

        <div>
          <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3">Easing</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
            <div className="border border-border rounded-lg p-4 space-y-1">
              <p className="font-semibold">Standard</p>
              <p className="text-muted-foreground font-mono">[0.22, 1, 0.36, 1]</p>
              <p className="text-muted-foreground">Every scroll reveal and card hover. Declare as <span className="font-mono">const ease = [...] as const</span> so TypeScript accepts it as an Easing.</p>
            </div>
            <div className="border border-border rounded-lg p-4 space-y-1">
              <p className="font-semibold">easeInOut</p>
              <p className="text-muted-foreground font-mono">&quot;easeInOut&quot;</p>
              <p className="text-muted-foreground">Only the page transition and the looping scroll arrow — motion with no start or end to accent.</p>
            </div>
          </div>
        </div>

        <div>
          <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3">Durations in use</h3>
          <div className="mt-1">
            <MotionRow token="duration-200" ms="200ms" usage="Colour and border changes — links, buttons, inputs. The default for a small state change." />
            <MotionRow token="duration-300" ms="300ms" usage="Card shadow on hover" />
            <MotionRow token="duration-500" ms="500ms" usage="Thumbnail zoom on card hover" />
            <MotionRow token="duration: 0.25" ms="250ms" usage="Page transition opacity fade (PageTransition)" />
            <MotionRow token="duration: 0.3" ms="300ms" usage="Card hover lift — ProjectCard and MoreProjectCard" />
            <MotionRow token="duration: 0.65" ms="650ms" usage="FadeInItem — one child of a staggered list" />
            <MotionRow token="duration: 0.7" ms="700ms" usage="FadeIn — a single section revealing on scroll" />
            <MotionRow token="duration: 1.6" ms="1600ms" usage="Scroll arrow bounce, repeats forever" />
            <MotionRow token="staggerChildren" ms="120ms" usage="Gap between FadeInGroup children" />
          </div>
          <p className="text-xs text-muted-foreground mt-3">
            Bare numbers are Framer Motion (seconds); <span className="font-mono">duration-*</span> are Tailwind classes. Framer Motion drives anything triggered — entrances, hovers, page changes. Ambient loops belong in CSS keyframes, because <span className="font-mono">requestAnimationFrame</span> is suspended while a tab is hidden and a long loop resumes out of phase.
          </p>
        </div>

        <div>
          <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3">Card hover</h3>
          <div className="flex flex-col sm:flex-row gap-6 sm:items-start">
            <CardHoverPreview />
            <div className="text-sm space-y-2 flex-1">
              <p className="text-muted-foreground">Both <span className="font-mono">ProjectCard</span> and <span className="font-mono">MoreProjectCard</span> use one recipe. Match it for any new card:</p>
              <ul className="text-muted-foreground space-y-1 list-disc pl-4">
                <li>Lift <span className="font-mono">y: -4</span> over <span className="font-mono">0.3s</span></li>
                <li><span className="font-mono">hover:shadow-lg</span> over <span className="font-mono">300ms</span> — not <span className="font-mono">xl</span>, which is roughly double the offset and softness and overpowers a 4px lift</li>
                <li>Thumbnail <span className="font-mono">group-hover:scale-[1.03]</span> over <span className="font-mono">500ms</span></li>
              </ul>
              <p className="text-muted-foreground">The <span className="font-mono">group</span> class goes on the same element as <span className="font-mono">whileHover</span>, so the lift and the zoom fire together.</p>
            </div>
          </div>

          <div className="border border-border rounded-lg p-4 mt-4 text-sm space-y-1">
            <p className="font-semibold">The two cards differ on purpose — do not unify these</p>
            <p className="text-muted-foreground">Radius <span className="font-mono">rounded-2xl</span> vs <span className="font-mono">rounded-xl</span> and border <span className="font-mono">/60</span> vs <span className="font-mono">/50</span>: ProjectCard is a full-width 500px split layout, MoreProjectCard is a grid tile, so the larger radius only reads correctly on the larger card.</p>
            <p className="text-muted-foreground">Clickable area: only MoreProjectCard wraps the whole card in a Link. On a case study card just the &ldquo;View case study&rdquo; button is clickable, so the card body correctly shows no pointer cursor.</p>
          </div>
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="text-lg font-semibold border-b border-border pb-2">Dark Mode Behavior</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
          <div className="border border-border rounded-lg p-4 space-y-1">
            <p className="font-semibold">Theme implementation</p>
            <p className="text-muted-foreground">Cookie-based SSR — no script tags</p>
            <p className="text-muted-foreground">layout.tsx reads <span className="font-mono">cookies()</span> server-side and sets <span className="font-mono">dark</span> class on <span className="font-mono">&lt;html&gt;</span> before paint</p>
            <p className="text-muted-foreground">ThemeProvider writes to both localStorage and <span className="font-mono">document.cookie</span> on every toggle</p>
          </div>
          <div className="border border-border rounded-lg p-4 space-y-1">
            <p className="font-semibold">Section caption color</p>
            <p className="text-muted-foreground">Light: uses admin-selected <span className="font-mono">caption_color</span> field (or --secondary-body fallback)</p>
            <p className="text-muted-foreground">Dark: always <span className="font-mono">var(--secondary-body)</span> = #A0A8BC — ignores admin color to stay readable</p>
            <p className="text-muted-foreground">Implemented via <span className="font-mono">useTheme()</span> in DynamicSectionRenderer</p>
          </div>
          <div className="border border-border rounded-lg p-4 space-y-1">
            <p className="font-semibold">Snapshot table — value column</p>
            <p className="text-muted-foreground">Light: #757575 (muted foreground)</p>
            <p className="text-muted-foreground">Dark: #A0A8BC (--secondary-body)</p>
            <p className="text-muted-foreground">SnapshotTable is a <span className="font-mono">"use client"</span> component using <span className="font-mono">useTheme()</span></p>
          </div>
          <div className="border border-border rounded-lg p-4 space-y-1">
            <p className="font-semibold">Secondary body text</p>
            <p className="text-muted-foreground">Use <span className="font-mono">var(--secondary-body)</span> for descriptions, captions, and body text that should be muted</p>
            <p className="text-muted-foreground">Light: #5B5B5B &nbsp;|&nbsp; Dark: #A0A8BC</p>
            <p className="text-muted-foreground">More Project card/detail title text uses <span className="font-mono">var(--foreground)</span> to stay readable in both modes</p>
          </div>
        </div>
      </section>

      {/* ── Components ── */}
      <section className="space-y-4">
        <h2 className="text-lg font-semibold border-b border-border pb-2">Key Component Styles</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
          <div className="border border-border rounded-lg p-4 space-y-1">
            <p className="font-semibold">Accent bar</p>
            <p className="text-muted-foreground">w-10 h-[3px] bg-primary rounded-full</p>
            <p className="text-muted-foreground">Appears above every section title</p>
          </div>
          <div className="border border-border rounded-lg p-4 space-y-1">
            <p className="font-semibold">Pill button (View case study)</p>
            <p className="text-muted-foreground">border border-primary <span className="font-mono">text-brand-text</span> rounded-full text-sm font-medium — the border is a surface, the label is brand text</p>
            <p className="text-muted-foreground">Hover: hover:bg-primary hover:text-primary-foreground, transition-all duration-200</p>
            <p className="text-muted-foreground">Sizing is not uniform: px-5 py-2 on the case study card and both detail pages, px-6 py-2.5 on About</p>
          </div>
          <div className="border border-border rounded-lg p-4 space-y-1">
            <p className="font-semibold">Nav (fixed header)</p>
            <p className="text-muted-foreground">h-20 inner row, bg-background/90, backdrop-blur-md, border-b border-border/30</p>
            <p className="text-muted-foreground">Links are 16px. Active: <span className="font-mono">text-brand-text</span> — not text-primary, which fails AA on the dark page background</p>
            <p className="text-muted-foreground">Inactive: #757575 light / #A0A8BC dark, hover returns to foreground</p>
          </div>
          <div className="border border-border rounded-lg p-4 space-y-1">
            <p className="font-semibold">Footer accent border</p>
            <p className="text-muted-foreground">height: 8px, backgroundColor: <span className="font-mono">var(--primary)</span> — the token, not a hard-coded hex, so it follows the theme</p>
            <p className="text-muted-foreground">Bottom edge of the footer</p>
          </div>
          <div className="border border-border rounded-lg p-4 space-y-1">
            <p className="font-semibold">More Projects card — dot separator</p>
            <p className="text-muted-foreground font-mono">{"{ · }"} between title and kind</p>
            <p className="text-muted-foreground">fontSize: 2rem, fontWeight: 900, lineHeight: 0.8, color: <span className="font-mono">var(--brand-text)</span> — it is a glyph, so it takes the text token</p>
            <p className="text-muted-foreground">No extra margin — spacing from character padding only</p>
          </div>
          <div className="border border-border rounded-lg p-4 space-y-1">
            <p className="font-semibold">More Projects — page navigation</p>
            <p className="text-muted-foreground">Looping prev / next at bottom of detail page</p>
            <p className="text-muted-foreground">getAdjacentMoreProjects wraps: last→first, first→last</p>
            <p className="text-muted-foreground">ScrollToTopButton centered between nav links</p>
          </div>
          <div className="border border-border rounded-lg p-4 space-y-1 sm:col-span-2">
            <p className="font-semibold">Bold text in content blocks</p>
            <p className="text-muted-foreground">Write <span className="font-mono">**text**</span> in any text block or description field</p>
            <p className="text-muted-foreground">renderInline() parses it to <span className="font-mono">{"<strong className='font-bold'>"}</span></p>
            <p className="text-muted-foreground">Applied to: dynamic-section paragraphs and bullets (so both detail page types), and the More Project description</p>
            <p className="text-muted-foreground">⚠️ NOT parsed in section subtitles or in the legacy CaseStudySection — <span className="font-mono">**text**</span> renders literally there</p>
          </div>
        </div>
      </section>
    </div>
  );
}
