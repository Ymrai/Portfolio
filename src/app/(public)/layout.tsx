import { Nav } from "@/components/public/nav";
import { Footer } from "@/components/public/footer";

export default function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <Nav />
      <main className="flex-1 pt-20">{children}</main>
      <Footer />
    </>
  );
}
