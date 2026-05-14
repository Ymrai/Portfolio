import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { Nav } from "@/components/public/nav";
import { Footer } from "@/components/public/footer";
import { getSetting } from "@/lib/supabase/queries";

export default async function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Read password from Supabase; fall back to env var during initial setup
  const storedPassword = await getSetting("portfolio_password");
  const password = storedPassword || process.env.PORTFOLIO_PASSWORD || "";

  if (password) {
    const cookieStore = await cookies();
    const auth = cookieStore.get("portfolio_auth")?.value;
    if (auth !== password) {
      redirect("/password");
    }
  }

  return (
    <>
      <Nav />
      <main className="flex-1 pt-20">{children}</main>
      <Footer />
    </>
  );
}
