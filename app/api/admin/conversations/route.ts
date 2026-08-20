import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { verifyToken, COOKIE_NAME } from "@/lib/auth";
import { fetchConversations } from "@/lib/supabase";

const PAGE_SIZE = 30;

async function isAuthorized(): Promise<boolean> {
  const store = await cookies();
  const token = store.get(COOKIE_NAME)?.value;
  return verifyToken(token, process.env.ADMIN_PASSWORD);
}

export async function GET(request: Request) {
  if (!await isAuthorized())
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const limit = Math.min(Number(searchParams.get("limit") ?? PAGE_SIZE), 100);
  const offset = Math.max(Number(searchParams.get("offset") ?? 0), 0);

  const items = await fetchConversations(limit, offset);
  return NextResponse.json(items);
}
