import { cookies } from "next/headers";
import { NextResponse } from "next/server";

export async function GET() {
  const cookieStore = await cookies();
  cookieStore.delete("portfolio_auth");

  return NextResponse.redirect(new URL("/password", process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"));
}
