"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  FolderKanban,
  ListPlus,
  User,
  Info,
  Palette,
  Settings,
  ExternalLink,
} from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  { label: "Dashboard", href: "/admin", icon: LayoutDashboard },
  { label: "Projects", href: "/admin/projects", icon: FolderKanban },
  { label: "More Projects", href: "/admin/more-projects", icon: ListPlus },
  { label: "About Me", href: "/admin/about", icon: User },
  { label: "Portfolio Info", href: "/admin/info", icon: Info },
  { label: "Design System", href: "/admin/design-system", icon: Palette },
  { label: "Settings", href: "/admin/settings", icon: Settings },
];

export function AdminSidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-56 shrink-0 border-r border-border min-h-screen p-4 flex flex-col gap-1">
      <div className="mb-6 px-2">
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
          Admin CMS
        </p>
      </div>

      {navItems.map(({ label, href, icon: Icon }) => (
        <Link
          key={href}
          href={href}
          className={cn(
            "flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors",
            pathname === href
              ? "bg-primary/10 text-primary font-medium"
              : "text-muted-foreground hover:bg-muted hover:text-foreground"
          )}
        >
          <Icon className="h-4 w-4" />
          {label}
        </Link>
      ))}

      <div className="mt-auto">
        <Link
          href="/"
          target="_blank"
          className="flex items-center gap-3 rounded-md px-3 py-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ExternalLink className="h-4 w-4" />
          View Site
        </Link>
      </div>
    </aside>
  );
}
