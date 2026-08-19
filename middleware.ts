import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { verifyToken, COOKIE_NAME } from "@/lib/auth";

export async function middleware(request: NextRequest) {
  try {
    const token = request.cookies.get(COOKIE_NAME)?.value;
    const isValid = await verifyToken(token, process.env.ADMIN_PASSWORD);
    if (isValid) return NextResponse.next();
  } catch {
    // 検証エラーはログインページへリダイレクト
  }
  return NextResponse.redirect(new URL("/admin", request.url));
}

// /admin（ログインページ自体）は除外し、/admin/* のみ保護
export const config = {
  matcher: ["/admin/:path+"],
};
