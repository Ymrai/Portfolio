"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import type { MoreProject } from "@/types";

export function MoreProjectCard({ project }: { project: MoreProject }) {
  const slug = project.slug ?? project.id;
  const label = [project.industry, project.kind].filter(Boolean).join(" | ");

  return (
    <motion.div
      whileHover={{ y: -4 }}
      transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
    >
      <Link
        href={`/more-projects/${slug}`}
        className="group flex flex-col rounded-xl overflow-hidden bg-card border border-border/50 hover:shadow-lg transition-shadow duration-300"
      >
        <div className="aspect-[4/3] overflow-hidden bg-muted">
          {project.cover_image_url ? (
            <img
              src={project.cover_image_url}
              alt={project.title}
              className="w-full h-full object-cover group-hover:scale-[1.03] transition-transform duration-500"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-muted to-secondary flex items-center justify-center">
              <span className="text-2xl font-bold text-muted-foreground/20">
                {project.title.charAt(0)}
              </span>
            </div>
          )}
        </div>

        <div className="px-5 py-6 space-y-1.5 w-full">
          {project.industry && (
            <p
              className="font-semibold uppercase tracking-widest"
              style={{ fontSize: "12px", color: "#D6009D" }}
            >
              {project.industry}
            </p>
          )}
          <p className="leading-snug font-semibold" style={{ fontSize: "24px", color: "var(--foreground)" }}>
            {project.title}
            {project.kind && (
              <>
                <span style={{ color: "#D6009D", fontSize: "2rem", lineHeight: 0.8, fontWeight: 900 }}>{" · "}</span>
                <span>{project.kind}</span>
              </>
            )}
          </p>
        </div>
      </Link>
    </motion.div>
  );
}
