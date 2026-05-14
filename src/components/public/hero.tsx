import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { GitBranch, ExternalLink, Mail, FileText } from "lucide-react";
import type { PortfolioInfo } from "@/types";

export function Hero({ info }: { info: PortfolioInfo }) {
  const initials = info.name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  return (
    <section className="py-20 space-y-8">
      <div className="flex items-center gap-5">
        {info.avatar_url && (
          <Avatar className="h-16 w-16">
            <AvatarImage src={info.avatar_url} alt={info.name} />
            <AvatarFallback>{initials}</AvatarFallback>
          </Avatar>
        )}
        <div>
          <p className="text-sm text-primary font-medium mb-0.5">Hi, I&apos;m</p>
          <h1 className="text-4xl font-bold tracking-tight">{info.name}</h1>
        </div>
      </div>

      {info.tagline && (
        <p className="text-xl text-muted-foreground max-w-xl">{info.tagline}</p>
      )}
      {info.bio_short && (
        <p className="text-base text-muted-foreground max-w-2xl leading-relaxed">
          {info.bio_short}
        </p>
      )}

      <div className="flex flex-wrap items-center gap-3">
        <Link href="/projects" className={buttonVariants()}>
          View Projects
        </Link>
        {info.resume_url && (
          <a
            href={info.resume_url}
            target="_blank"
            rel="noopener noreferrer"
            className={buttonVariants({ variant: "outline" })}
          >
            <FileText className="h-4 w-4 mr-2" />
            Resume
          </a>
        )}
        <div className="flex items-center gap-2 ml-1">
          {info.github_url && (
            <a
              href={info.github_url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              <GitBranch className="h-5 w-5" />
            </a>
          )}
          {info.linkedin_url && (
            <a
              href={info.linkedin_url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              <ExternalLink className="h-4 w-4" />
            </a>
          )}
          {info.email && (
            <a
              href={`mailto:${info.email}`}
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              <Mail className="h-5 w-5" />
            </a>
          )}
        </div>
      </div>
    </section>
  );
}
