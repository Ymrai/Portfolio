"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";

export function PageTransition({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const prevPathname = useRef(pathname);

  useEffect(() => {
    if (prevPathname.current !== pathname) {
      // Scroll to top instantly before the new page fades in —
      // using "instant" prevents a visible scroll animation during the transition.
      window.scrollTo({ top: 0, behavior: "instant" as ScrollBehavior });
      prevPathname.current = pathname;
    }
  }, [pathname]);

  return (
    <AnimatePresence mode="wait" initial={false}>
      <motion.div
        key={pathname}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        // No exit prop = instant disappear. mode="wait" has nothing to wait for,
        // so the new page starts fading in immediately — no blank gap.
        transition={{ duration: 0.25, ease: "easeInOut" }}
        className="flex flex-col flex-1"
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
}
