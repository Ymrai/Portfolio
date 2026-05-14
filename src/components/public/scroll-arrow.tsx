"use client";

import { motion } from "framer-motion";
import { ArrowDown } from "@phosphor-icons/react";

export function ScrollArrow({ targetId }: { targetId: string }) {
  function handleClick() {
    const target = document.getElementById(targetId);
    if (!target) return;
    // Offset by 112px to clear the fixed header (80px) + breathing room
    const targetY = target.getBoundingClientRect().top + window.scrollY - 112;
    window.scrollTo({ top: targetY, behavior: "smooth" });
  }

  return (
    <motion.button
      type="button"
      onClick={handleClick}
      aria-label="Scroll to case studies"
      animate={{ y: [0, 8, 0] }}
      transition={{ duration: 1.6, repeat: Infinity, ease: "easeInOut" }}
      style={{
        color: "#D6009D",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "none",
        border: "none",
        cursor: "pointer",
        padding: "8px",
      }}
    >
      <ArrowDown size={48} weight="bold" color="#D6009D" />
    </motion.button>
  );
}
