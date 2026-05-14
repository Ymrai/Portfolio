"use client";

import { useEffect, useState, useTransition } from "react";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { ImageUpload } from "@/components/admin/image-upload";
import { PdfUpload } from "@/components/admin/pdf-upload";
import { savePortfolioInfo } from "@/app/actions/portfolio-info";
import { createClient } from "@/lib/supabase/client";
import type { PortfolioInfo } from "@/types";

export default function AdminInfoPage() {
  const [, setInfo] = useState<PortfolioInfo | null>(null);
  const [pending, startTransition] = useTransition();

  // Identity
  const [name, setName] = useState("");
  const [tagline, setTagline] = useState("");
  const [bioShort, setBioShort] = useState("");
  const [email, setEmail] = useState("");
  const [githubUrl, setGithubUrl] = useState("");
  const [linkedinUrl, setLinkedinUrl] = useState("");
  const [resumeUrl, setResumeUrl] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");

  // Home page
  const [homeIntroText, setHomeIntroText] = useState("");
  const [homeCaseStudiesTitle, setHomeCaseStudiesTitle] = useState("");
  const [homeCaseStudiesSubtitle, setHomeCaseStudiesSubtitle] = useState("");
  const [homeCaseStudiesDescription, setHomeCaseStudiesDescription] = useState("");

  // More page
  const [morePageTitle, setMorePageTitle] = useState("");
  const [morePageSubtitle, setMorePageSubtitle] = useState("");
  const [morePageDescription, setMorePageDescription] = useState("");

  // About Me page
  const [aboutPageTitle, setAboutPageTitle] = useState("");
  const [aboutPageSubtitle, setAboutPageSubtitle] = useState("");

  // Footer
  const [footerTitle, setFooterTitle] = useState("");
  const [footerSubtitle, setFooterSubtitle] = useState("");

  useEffect(() => {
    const supabase = createClient();
    supabase
      .from("portfolio_info")
      .select("*")
      .eq("id", 1)
      .single()
      .then(({ data }) => {
        if (!data) return;
        setInfo(data);
        setName(data.name ?? "");
        setTagline(data.tagline ?? "");
        setBioShort(data.bio_short ?? "");
        setEmail(data.email ?? "");
        setGithubUrl(data.github_url ?? "");
        setLinkedinUrl(data.linkedin_url ?? "");
        setResumeUrl(data.resume_url ?? "");
        setAvatarUrl(data.avatar_url ?? "");
        setHomeIntroText(data.home_intro_text ?? "");
        setHomeCaseStudiesTitle(data.home_case_studies_title ?? "");
        setHomeCaseStudiesSubtitle(data.home_case_studies_subtitle ?? "");
        setHomeCaseStudiesDescription(data.home_case_studies_description ?? "");
        setMorePageTitle(data.more_page_title ?? "");
        setMorePageSubtitle(data.more_page_subtitle ?? "");
        setMorePageDescription(data.more_page_description ?? "");
        setAboutPageTitle(data.about_page_title ?? "");
        setAboutPageSubtitle(data.about_page_subtitle ?? "");
        setFooterTitle(data.footer_title ?? "");
        setFooterSubtitle(data.footer_subtitle ?? "");
      });
  }, []);

  function buildPayload(overrides?: Partial<{ avatar_url: string; resume_url: string }>) {
    return {
      name,
      tagline: tagline || undefined,
      bio_short: bioShort || undefined,
      email: email || undefined,
      github_url: githubUrl || undefined,
      linkedin_url: linkedinUrl || undefined,
      resume_url: (overrides?.resume_url ?? resumeUrl) || undefined,
      avatar_url: (overrides?.avatar_url ?? avatarUrl) || undefined,
      home_intro_text: homeIntroText || undefined,
      home_case_studies_title: homeCaseStudiesTitle || undefined,
      home_case_studies_subtitle: homeCaseStudiesSubtitle || undefined,
      home_case_studies_description: homeCaseStudiesDescription || undefined,
      more_page_title: morePageTitle || undefined,
      more_page_subtitle: morePageSubtitle || undefined,
      more_page_description: morePageDescription || undefined,
      about_page_title: aboutPageTitle || undefined,
      about_page_subtitle: aboutPageSubtitle || undefined,
      footer_title: footerTitle || undefined,
      footer_subtitle: footerSubtitle || undefined,
    };
  }

  function handleSave() {
    startTransition(async () => {
      const { error } = await savePortfolioInfo(buildPayload());
      if (error) { toast.error(error); return; }
      toast.success("Portfolio info saved");
    });
  }

  function handleAvatarChange(url: string) {
    setAvatarUrl(url);
    startTransition(async () => {
      const { error } = await savePortfolioInfo(buildPayload({ avatar_url: url }));
      if (error) { toast.error(error); return; }
      toast.success("Avatar saved");
    });
  }

  function handleResumeChange(url: string) {
    setResumeUrl(url);
    startTransition(async () => {
      const { error } = await savePortfolioInfo(buildPayload({ resume_url: url }));
      if (error) { toast.error(error); return; }
      toast.success("Resume saved");
    });
  }

  return (
    <div className="max-w-2xl space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Portfolio Info</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Identity, page content, and contact links
          </p>
        </div>
        <Button onClick={handleSave} disabled={pending}>
          {pending ? "Saving…" : "Save"}
        </Button>
      </div>

      {/* ── Identity ── */}
      <div className="space-y-1.5">
        <Label>Avatar</Label>
        <ImageUpload
          value={avatarUrl}
          onChange={handleAvatarChange}
          folder="avatars"
          aspectRatio="square"
          label="Upload avatar"
        />
      </div>

      <Separator />

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label>Name *</Label>
          <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Your Name" />
        </div>
        <div className="space-y-1.5">
          <Label>Tagline / Skills</Label>
          <Input value={tagline} onChange={(e) => setTagline(e.target.value)} placeholder="Complex systems • B2B platforms • …" />
        </div>
      </div>

      <div className="space-y-1.5">
        <Label>Short Bio</Label>
        <Textarea
          value={bioShort}
          onChange={(e) => setBioShort(e.target.value)}
          placeholder="Hi, I'm Yael Rosenberg, a senior product designer…"
          rows={3}
        />
      </div>

      <Separator />

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label>Email</Label>
          <Input value={email} onChange={(e) => setEmail(e.target.value)} type="email" placeholder="you@email.com" />
        </div>
        <div className="space-y-1.5">
          <Label>GitHub URL</Label>
          <Input value={githubUrl} onChange={(e) => setGithubUrl(e.target.value)} placeholder="https://github.com/…" />
        </div>
        <div className="space-y-1.5">
          <Label>LinkedIn URL</Label>
          <Input value={linkedinUrl} onChange={(e) => setLinkedinUrl(e.target.value)} placeholder="https://linkedin.com/in/…" />
        </div>
      </div>

      <Separator />

      <div className="space-y-1.5">
        <Label>Resume (PDF)</Label>
        <PdfUpload value={resumeUrl} onChange={handleResumeChange} folder="resumes" />
      </div>

      {/* ── Home Page ── */}
      <Separator />
      <div>
        <h2 className="text-base font-semibold mb-4">Home Page</h2>
        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label>Intro Text</Label>
            <Textarea
              value={homeIntroText}
              onChange={(e) => setHomeIntroText(e.target.value)}
              placeholder={`Hi, I'm Yael Rosenberg, a senior product designer\nturning complex systems into clear, intuitive\nand scalable experiences.`}
              rows={4}
            />
            <p className="text-xs text-muted-foreground">
              Use newlines to control line breaks. Your name will be highlighted automatically.
            </p>
          </div>
          <div className="space-y-1.5">
            <Label>Case Studies — Section Title</Label>
            <Input value={homeCaseStudiesTitle} onChange={(e) => setHomeCaseStudiesTitle(e.target.value)} placeholder="Case Studies" />
          </div>
          <div className="space-y-1.5">
            <Label>Case Studies — Subtitle</Label>
            <Input value={homeCaseStudiesSubtitle} onChange={(e) => setHomeCaseStudiesSubtitle(e.target.value)} placeholder="Selected end-to-end product work" />
          </div>
          <div className="space-y-1.5">
            <Label>Case Studies — Description</Label>
            <Input value={homeCaseStudiesDescription} onChange={(e) => setHomeCaseStudiesDescription(e.target.value)} placeholder="Deep dives into complex systems, from discovery and strategy through delivered design." />
          </div>
        </div>
      </div>

      {/* ── More Page ── */}
      <Separator />
      <div>
        <h2 className="text-base font-semibold mb-4">More Projects Page</h2>
        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label>Page Title</Label>
            <Input value={morePageTitle} onChange={(e) => setMorePageTitle(e.target.value)} placeholder="More Projects" />
          </div>
          <div className="space-y-1.5">
            <Label>Page Subtitle</Label>
            <Input value={morePageSubtitle} onChange={(e) => setMorePageSubtitle(e.target.value)} placeholder="Branding, print & concept projects" />
          </div>
          <div className="space-y-1.5">
            <Label>Page Description</Label>
            <Input value={morePageDescription} onChange={(e) => setMorePageDescription(e.target.value)} placeholder="A broader selection of work across visual design, branding and print." />
          </div>
        </div>
      </div>

      {/* ── About Me Page ── */}
      <Separator />
      <div>
        <h2 className="text-base font-semibold mb-4">About Me Page</h2>
        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label>Page Title</Label>
            <Input value={aboutPageTitle} onChange={(e) => setAboutPageTitle(e.target.value)} placeholder="About me" />
          </div>
          <div className="space-y-1.5">
            <Label>Page Subtitle</Label>
            <Input value={aboutPageSubtitle} onChange={(e) => setAboutPageSubtitle(e.target.value)} placeholder="Designing clarity for complex products" />
          </div>
        </div>
      </div>

      {/* ── Footer ── */}
      <Separator />
      <div>
        <h2 className="text-base font-semibold mb-4">Footer</h2>
        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label>Footer Title</Label>
            <Input value={footerTitle} onChange={(e) => setFooterTitle(e.target.value)} placeholder="Let's Connect" />
          </div>
          <div className="space-y-1.5">
            <Label>Footer Subtitle</Label>
            <Input value={footerSubtitle} onChange={(e) => setFooterSubtitle(e.target.value)} placeholder="Let's talk projects, collaborations or anything design!" />
          </div>
        </div>
      </div>
    </div>
  );
}
