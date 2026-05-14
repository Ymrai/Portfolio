import type { Database, Json } from "./database";

export type PortfolioInfo =
  Database["public"]["Tables"]["portfolio_info"]["Row"];
export type Project = Database["public"]["Tables"]["projects"]["Row"];
export type MoreProject =
  Database["public"]["Tables"]["more_projects"]["Row"];
export type AboutMe = Database["public"]["Tables"]["about_me"]["Row"];

export type ProjectStatus = "draft" | "published";

export interface CaseStudySection {
  text: string;
  images: string[];
}

export interface CaseStudy {
  context: CaseStudySection;
  problem_statement: CaseStudySection;
  constraints: CaseStudySection;
  responsibilities: CaseStudySection;
  key_decisions: CaseStudySection;
  outcome: CaseStudySection;
  learning: CaseStudySection;
}

export const CASE_STUDY_SECTIONS: {
  key: keyof CaseStudy;
  label: string;
}[] = [
  { key: "context", label: "Context" },
  { key: "problem_statement", label: "Problem Statement" },
  { key: "constraints", label: "Constraints" },
  { key: "responsibilities", label: "My Responsibilities" },
  { key: "key_decisions", label: "Key Decisions & Tradeoffs" },
  { key: "outcome", label: "Outcome / Results" },
  { key: "learning", label: "Learning" },
];

export function emptySection(): CaseStudySection {
  return { text: "", images: [] };
}

export function emptyCaseStudy(): CaseStudy {
  return {
    context: emptySection(),
    problem_statement: emptySection(),
    constraints: emptySection(),
    responsibilities: emptySection(),
    key_decisions: emptySection(),
    outcome: emptySection(),
    learning: emptySection(),
  };
}

export function parseCaseStudy(raw: Json | null | undefined): CaseStudy {
  const empty = emptyCaseStudy();
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return empty;

  function parseSection(s: unknown): CaseStudySection {
    if (!s || typeof s !== "object" || Array.isArray(s))
      return emptySection();
    const obj = s as Record<string, unknown>;
    return {
      text: typeof obj.text === "string" ? obj.text : "",
      images: Array.isArray(obj.images)
        ? (obj.images as string[]).filter((x) => typeof x === "string")
        : [],
    };
  }

  const cs = raw as Record<string, unknown>;
  return {
    context: parseSection(cs.context),
    problem_statement: parseSection(cs.problem_statement),
    constraints: parseSection(cs.constraints),
    responsibilities: parseSection(cs.responsibilities),
    key_decisions: parseSection(cs.key_decisions),
    outcome: parseSection(cs.outcome),
    learning: parseSection(cs.learning),
  };
}

// ── Dynamic case-study sections ──────────────────────────────────────────────

export interface SliderImage {
  id: string;
  url: string;
  alt?: string;
}

export interface SectionBlock {
  id: string;
  type: "text" | "image" | "slider";
  layout?: "single" | "two-column";                  // text blocks
  content?: string;                                   // text blocks (left/text column)
  content_right?: string;                             // text+text: right text column
  column_right_type?: "text" | "image";              // two-column: right column type
  column_right_image_url?: string;                   // two-column text+image: image url
  column_order?: "text-left" | "image-left";         // two-column text+image: order
  url?: string;                                       // image blocks
  alt?: string;                                       // image blocks
  images?: SliderImage[];                             // slider blocks
}

export interface DynamicSection {
  id: string;
  caption?: string;
  caption_color?: string;
  title: string;
  subtitle?: string;
  blocks: SectionBlock[];
}

export function parseSections(raw: unknown): DynamicSection[] {
  if (!Array.isArray(raw)) return [];
  return (raw as unknown[]).flatMap((item) => {
    if (!item || typeof item !== "object" || Array.isArray(item)) return [];
    const s = item as Record<string, unknown>;
    if (typeof s.id !== "string" || typeof s.title !== "string") return [];
    const blocks: SectionBlock[] = Array.isArray(s.blocks)
      ? (s.blocks as unknown[]).flatMap<SectionBlock>((b) => {
          if (!b || typeof b !== "object" || Array.isArray(b)) return [];
          const bk = b as Record<string, unknown>;
          if (typeof bk.id !== "string") return [];
          if (bk.type === "text") {
            return [{
              id: bk.id,
              type: "text" as const,
              layout: bk.layout === "two-column" ? "two-column" as const : "single" as const,
              content: typeof bk.content === "string" ? bk.content : "",
              content_right: typeof bk.content_right === "string" ? bk.content_right : "",
              column_right_type: bk.column_right_type === "image" ? "image" as const : "text" as const,
              column_right_image_url: typeof bk.column_right_image_url === "string" ? bk.column_right_image_url : "",
              column_order: bk.column_order === "image-left" ? "image-left" as const : "text-left" as const,
            }];
          }
          if (bk.type === "image") {
            return [{ id: bk.id, type: "image" as const, url: typeof bk.url === "string" ? bk.url : "", alt: typeof bk.alt === "string" ? bk.alt : "" }];
          }
          if (bk.type === "slider") {
            const images: SliderImage[] = Array.isArray(bk.images)
              ? (bk.images as unknown[]).flatMap((img) => {
                  if (!img || typeof img !== "object" || Array.isArray(img)) return [];
                  const im = img as Record<string, unknown>;
                  if (typeof im.id !== "string" || typeof im.url !== "string") return [];
                  return [{ id: im.id, url: im.url, alt: typeof im.alt === "string" ? im.alt : undefined }];
                })
              : [];
            return [{ id: bk.id, type: "slider" as const, images }];
          }
          return [];
        })
      : [];
    return [{
      id: s.id,
      caption: typeof s.caption === "string" ? s.caption : undefined,
      caption_color: typeof s.caption_color === "string" ? s.caption_color : undefined,
      title: s.title,
      subtitle: typeof s.subtitle === "string" ? s.subtitle : undefined,
      blocks,
    }];
  });
}

// ── Legacy case-study (kept for backward-compat) ──────────────────────────────

export interface ExperienceEntry {
  company: string;
  role: string;
  start_date: string;
  end_date: string | null;
  description: string;
}

export interface EducationEntry {
  institution: string;
  degree: string;
  field: string;
  graduation_year: number;
}

export function parseExperience(raw: Json): ExperienceEntry[] {
  if (!Array.isArray(raw)) return [];
  return (raw as unknown[]).filter(
    (e): e is ExperienceEntry =>
      e !== null &&
      typeof e === "object" &&
      !Array.isArray(e) &&
      typeof (e as Record<string, unknown>).company === "string"
  );
}

export function parseEducation(raw: Json): EducationEntry[] {
  if (!Array.isArray(raw)) return [];
  return (raw as unknown[]).filter(
    (e): e is EducationEntry =>
      e !== null &&
      typeof e === "object" &&
      !Array.isArray(e) &&
      typeof (e as Record<string, unknown>).institution === "string"
  );
}
