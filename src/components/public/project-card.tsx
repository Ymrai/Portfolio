"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import type { Project } from "@/types";

interface ProjectCardProps {
  project: Project;
  index: number;
}

export function ProjectCard({ project, index }: ProjectCardProps) {
  const isEven = index % 2 === 0;
  const imgColBg = project.card_bg_color || "var(--muted)";

  // On mobile: DOM order is always imgCol first, textCol second (image on top).
  // On desktop: alternate layout via md:order-* classes.
  //   Even  → text-left / image-right  (text md:order-1, img md:order-2)
  //   Odd   → image-left / text-right  (img md:order-1, text md:order-2)

  return (
    <motion.div
      whileHover={{ y: -4 }}
      transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
      className="rounded-2xl overflow-hidden border border-border/60 bg-card shadow-sm hover:shadow-xl transition-shadow duration-300"
    >
      <div className="flex flex-col md:flex-row md:h-[500px]">

        {/* Image column — always first in DOM → top on mobile */}
        <div
          className={`order-1 h-[240px] md:h-auto w-full md:w-1/2 md:flex-none ${isEven ? "md:order-2" : "md:order-1"}`}
          style={{ backgroundColor: imgColBg, position: "relative" }}
        >
          {project.image_url && (
            <img
              src={project.image_url}
              alt={project.title}
              style={{
                position: "absolute",
                top: "24px",
                left: "24px",
                right: "24px",
                bottom: "24px",
                width: "calc(100% - 48px)",
                height: "calc(100% - 48px)",
                objectFit: "contain",
                display: "block",
                borderRadius: "8px",
              }}
            />
          )}
        </div>

        {/* Text column — second in DOM → below image on mobile */}
        <div
          className={`order-2 flex flex-col justify-center bg-card p-8 md:p-10 lg:p-14 w-full md:w-1/2 md:flex-none ${isEven ? "md:order-1" : "md:order-2"}`}
        >
          {project.company && (
            <p
              className="text-xs font-semibold tracking-widest mb-3"
              style={{ color: "var(--brand-text)", fontVariant: "small-caps" }}
            >
              {project.company}
            </p>
          )}
          <h3 className="text-xl md:text-2xl lg:text-3xl font-bold leading-snug text-foreground">
            {project.title}
          </h3>
          {project.description && (
            <p className="mt-4 text-sm lg:text-base leading-relaxed" style={{ color: "var(--secondary-body)" }}>
              {project.description}
            </p>
          )}
          <Link
            href={`/projects/${project.slug}`}
            className="mt-6 self-start inline-flex items-center gap-2 border border-primary text-brand-text rounded-full px-5 py-2 text-sm font-medium hover:bg-primary hover:text-primary-foreground transition-all duration-200"
          >
            View case study
          </Link>
        </div>

      </div>
    </motion.div>
  );
}
