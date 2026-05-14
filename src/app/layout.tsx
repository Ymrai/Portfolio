import type { Metadata } from "next";
import { Manrope } from "next/font/google";
import { cookies } from "next/headers";
import { ThemeProvider } from "@/components/providers/theme-provider";
import { Toaster } from "@/components/ui/sonner";
import "./globals.css";

const manrope = Manrope({
  variable: "--font-manrope",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700", "800"],
});

export const metadata: Metadata = {
  title: { default: "Yael Rosenberg", template: "%s | Yael Rosenberg" },
  description:
    "Senior Product Designer — turning complex systems into clear, intuitive experiences",
};

export default async function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  // Read the theme cookie set by ThemeProvider so the correct class is applied
  // during SSR — zero FOUC, zero script tags, zero React warnings.
  const cookieStore = await cookies();
  const themeCookie = cookieStore.get("theme")?.value;
  // "system" means the client hasn't resolved it yet; treat as "light" on the
  // server. The ThemeProvider corrects the class on mount if needed.
  const htmlClass =
    themeCookie === "dark"
      ? `${manrope.variable} h-full antialiased dark`
      : `${manrope.variable} h-full antialiased`;

  return (
    <html
      lang="en"
      className={htmlClass}
      suppressHydrationWarning
    >
      <body className="min-h-full flex flex-col" suppressHydrationWarning>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          {children}
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  );
}
