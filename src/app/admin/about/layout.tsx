// Server segment guard for the (client-component) About admin page.
import { requireAdminPage } from "@/lib/auth/require-admin";

export default async function AdminAboutLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireAdminPage();
  return <>{children}</>;
}
