import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { revalidateTag } from "next/cache";
import { verifyToken, COOKIE_NAME } from "@/lib/auth";
import { updateMenu, deleteMenu } from "@/lib/supabase";

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
  const { name, price, description } = body as Record<string, unknown>;

  if (!name || typeof name !== "string" || !name.trim())
    return NextResponse.json({ error: "メニュー名は必須です" }, { status: 400 });

  const priceNum = Number(price);
  if (!Number.isInteger(priceNum) || priceNum < 0)
    return NextResponse.json({ error: "料金は0以上の整数を入力してください" }, { status: 400 });

  const desc = typeof description === "string" ? description.trim() || null : null;

  await updateMenu(numId, { name: name.trim(), price: priceNum, description: desc });
  revalidateTag("menus", { expire: 0 });
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

  await deleteMenu(numId);
  revalidateTag("menus", { expire: 0 });
  return NextResponse.json({ ok: true });
}
