"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { ThemeToggle } from "./theme-toggle";
import { cn } from "@/lib/utils";

const links = [
  { label: "Projects", href: "/" },
  { label: "More", href: "/more-projects" },
  { label: "About Me", href: "/about" },
];

export function Nav() {
  const pathname = usePathname();
  const router = useRouter();

  function isActive(href: string) {
    if (href === "/") return pathname === "/" || pathname.startsWith("/projects");
    return pathname.startsWith(href);
  }

  // Logo and Projects: navigate to "/" and always scroll to top
  function handleHomeClick(e: React.MouseEvent) {
    e.preventDefault();
    if (pathname === "/") {
      window.scrollTo({ top: 0, behavior: "smooth" });
    } else {
      router.push("/");
    }
  }

  return (
    <header className="fixed top-0 z-50 w-full bg-background/90 backdrop-blur-md border-b border-border/30">
      <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
        <a
          href="/"
          onClick={handleHomeClick}
          className="font-extrabold text-xl tracking-tight text-primary hover:opacity-80 transition-opacity cursor-pointer"
        >
          YR.
        </a>

        <nav className="flex items-center gap-7">
          {links.map((link) => {
            const isHome = link.href === "/";
            return (
              <a
                key={link.href}
                href={link.href}
                onClick={isHome ? handleHomeClick : undefined}
                className={cn(
                  "text-[16px] font-medium transition-colors duration-200",
                  isActive(link.href)
                    ? "text-primary"
                    : "text-[#757575] dark:text-[#A0A8BC] hover:text-foreground dark:hover:text-foreground"
                )}
              >
                {link.label}
              </a>
            );
          })}
          <ThemeToggle />
        </nav>
      </div>
    </header>
  );
}
