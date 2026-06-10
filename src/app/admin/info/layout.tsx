// Server segment guard for the (client-component) Info admin page.
import { requireAdminPage } from "@/lib/auth/require-admin";

export default async function AdminInfoLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireAdminPage();
  return <>{children}</>;
}
