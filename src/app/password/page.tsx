import type { Metadata } from "next";
import { PasswordForm } from "./password-form";

export const metadata: Metadata = { title: "Password Protected" };

export default function PasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ from?: string }>;
}) {
  // Pass `from` through to the form so the server action can redirect back
  return <PasswordForm searchParams={searchParams} />;
}
