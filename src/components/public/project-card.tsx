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
  const imgColBg = project.card_bg_color || "#F5F5F0";

  const textCol = (
    <div className="flex flex-col justify-center bg-white p-10 lg:p-14" style={{ flex: "0 0 50%", width: "50%" }}>
      {project.company && (
        <p
          className="text-xs font-semibold tracking-widest mb-3"
          style={{ color: "#D6009D", fontVariant: "small-caps" }}
        >
          {project.company}
        </p>
      )}
      <h3 className="text-2xl lg:text-3xl font-bold leading-snug text-gray-900">
        {project.title}
      </h3>
      {project.description && (
        <p className="mt-4 text-sm lg:text-base leading-relaxed" style={{ color: "#757575" }}>
          {project.description}
        </p>
      )}
      <Link
        href={`/projects/${project.slug}`}
        className="mt-7 inline-flex self-start items-center gap-2 border border-primary text-primary rounded-full px-6 py-2.5 text-sm font-medium hover:bg-primary hover:text-white transition-all duration-200"
      >
        View case study
      </Link>
    </div>
  );

  // Image column: position:relative so the absolutely-positioned image has a
  // definite containing-block height. On mobile an explicit h-[280px] is set so
  // the absolute child can resolve percentage heights; on md+ the flex-row
  // container is h-[500px] and align-items:stretch drives the column to 500px.
  const imgCol = (
    <div
      className="h-[280px] md:h-auto"
      style={{
        flex: "0 0 50%",
        width: "50%",
        backgroundColor: imgColBg,
        position: "relative",
      }}
    >
      {project.image_url && (
        <img
          src={project.image_url}
          alt={project.title}
          style={{
            position: "absolute",
            top: "32px",
            left: "32px",
            right: "32px",
            bottom: "32px",
            width: "calc(100% - 64px)",
            height: "calc(100% - 64px)",
            objectFit: "contain",
            display: "block",
            borderRadius: "8px",
          }}
        />
      )}
    </div>
  );

  return (
    <motion.div
      whileHover={{ y: -4 }}
      transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
      className="rounded-2xl overflow-hidden border border-border/60 bg-white shadow-sm hover:shadow-xl transition-shadow duration-300"
    >
      {/* Fixed 500px height on desktop; flex stretch makes both columns fill it */}
      <div className="flex flex-col md:flex-row md:h-[500px]">
        {isEven ? <>{textCol}{imgCol}</> : <>{imgCol}{textCol}</>}
      </div>
    </motion.div>
  );
}
