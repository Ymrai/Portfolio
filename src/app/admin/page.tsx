import type { Metadata } from "next";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FolderKanban, ListPlus, User, Info } from "lucide-react";
import Link from "next/link";

export const metadata: Metadata = { title: "Dashboard" };

const sections = [
  {
    title: "Projects",
    description: "Manage your featured projects",
    href: "/admin/projects",
    icon: FolderKanban,
  },
  {
    title: "More Projects",
    description: "Manage your additional projects list",
    href: "/admin/more-projects",
    icon: ListPlus,
  },
  {
    title: "About Me",
    description: "Edit your bio, skills, and experience",
    href: "/admin/about",
    icon: User,
  },
  {
    title: "Portfolio Info",
    description: "Update your name, tagline, and links",
    href: "/admin/info",
    icon: Info,
  },
];

export default function AdminDashboard() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Manage your portfolio content
        </p>
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {sections.map(({ title, description, href, icon: Icon }) => (
          <Link key={href} href={href}>
            <Card className="hover:border-primary/50 transition-colors cursor-pointer h-full">
              <CardHeader className="flex flex-row items-center gap-3 pb-2">
                <div className="p-2 rounded-md bg-primary/10">
                  <Icon className="h-4 w-4 text-primary" />
                </div>
                <CardTitle className="text-base">{title}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">{description}</p>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
