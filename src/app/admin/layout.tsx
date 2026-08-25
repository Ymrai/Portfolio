import { AdminSidebar } from "@/components/admin/sidebar";
import { ThemeToggle } from "@/components/public/theme-toggle";
import { DARK_MODE_ENABLED } from "@/lib/theme-config";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: { default: "Admin", template: "%s | Admin" },
};

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen">
      <AdminSidebar />
      <div className="flex-1 flex flex-col">
        <header className="h-14 border-b border-border flex items-center justify-end px-6 gap-4">
          {/* Hidden, not removed — see DARK_MODE_ENABLED in lib/theme-config.ts */}
          {DARK_MODE_ENABLED && <ThemeToggle />}
        </header>
        <main className="flex-1 p-6">{children}</main>
      </div>
    </div>
  );
}
