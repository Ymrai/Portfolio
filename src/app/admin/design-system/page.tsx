import type { Metadata } from "next";

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

export default function DesignSystemPage() {
  return (
    <div className="max-w-3xl space-y-12 pb-16">
      <div>
        <h1 className="text-2xl font-bold">Design System</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Read-only reference for colors, typography, and spacing used across the site.
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
            <p className="text-muted-foreground">border border-primary text-primary rounded-full px-6 py-2.5 text-sm</p>
          </div>
          <div className="border border-border rounded-lg p-4 space-y-1">
            <p className="font-semibold">Nav (fixed header)</p>
            <p className="text-muted-foreground">h-16, bg-background/90, backdrop-blur-md</p>
            <p className="text-muted-foreground">Active: text-primary. Inactive: text-foreground/55</p>
          </div>
          <div className="border border-border rounded-lg p-4 space-y-1">
            <p className="font-semibold">Footer accent border</p>
            <p className="text-muted-foreground">height: 8px, backgroundColor: #D6009D</p>
            <p className="text-muted-foreground">Bottom edge of the footer</p>
          </div>
          <div className="border border-border rounded-lg p-4 space-y-1">
            <p className="font-semibold">More Projects card — dot separator</p>
            <p className="text-muted-foreground font-mono">{"{ · }"} between title and kind</p>
            <p className="text-muted-foreground">fontSize: 2rem, fontWeight: 900, color: #D6009D, lineHeight: 0.8</p>
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
            <p className="text-muted-foreground">Applied to: text block paragraphs &amp; bullets, More Project description, dynamic section subtitles</p>
          </div>
        </div>
      </section>
    </div>
  );
}
