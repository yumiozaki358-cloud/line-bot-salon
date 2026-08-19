import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { verifyToken, COOKIE_NAME } from "@/lib/auth";
import { updateFaq, deleteFaq } from "@/lib/supabase";

async function isAuthorized(): Promise<boolean> {
  const store = await cookies();
  const token = store.get(COOKIE_NAME)?.value;
  return verifyToken(token, process.env.ADMIN_PASSWORD);
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!await isAuthorized())
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const numId = Number(id);
  if (!Number.isInteger(numId) || numId <= 0)
    return NextResponse.json({ error: "無効なID" }, { status: 400 });

  const body = await request.json().catch(() => ({}));
  const { question, answer, category } = body as Record<string, unknown>;

  if (!question || !answer || !category ||
      typeof question !== "string" || typeof answer !== "string" || typeof category !== "string") {
    return NextResponse.json({ error: "質問・回答・カテゴリは必須です" }, { status: 400 });
  }

  await updateFaq(numId, { question: question.trim(), answer: answer.trim(), category: category.trim() });
  return NextResponse.json({ ok: true });
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!await isAuthorized())
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const numId = Number(id);
  if (!Number.isInteger(numId) || numId <= 0)
    return NextResponse.json({ error: "無効なID" }, { status: 400 });

  await deleteFaq(numId);
  return NextResponse.json({ ok: true });
}
