import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { revalidateTag } from "next/cache";
import { verifyToken, COOKIE_NAME } from "@/lib/auth";
import { fetchFaqsWithId, createFaq } from "@/lib/supabase";

async function isAuthorized(): Promise<boolean> {
  const store = await cookies();
  const token = store.get(COOKIE_NAME)?.value;
  return verifyToken(token, process.env.ADMIN_PASSWORD);
}

export async function GET() {
  if (!await isAuthorized())
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const faqs = await fetchFaqsWithId();
  return NextResponse.json(faqs);
}

export async function POST(request: Request) {
  if (!await isAuthorized())
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json().catch(() => ({}));
  const { question, answer, category } = body as Record<string, unknown>;

  if (!question || !answer || !category ||
      typeof question !== "string" || typeof answer !== "string" || typeof category !== "string") {
    return NextResponse.json({ error: "質問・回答・カテゴリは必須です" }, { status: 400 });
  }

  await createFaq({ question: question.trim(), answer: answer.trim(), category: category.trim() });
  revalidateTag("faqs", { expire: 0 });
  return NextResponse.json({ ok: true }, { status: 201 });
}
