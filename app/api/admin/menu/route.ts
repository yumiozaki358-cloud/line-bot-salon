import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { verifyToken, COOKIE_NAME } from "@/lib/auth";
import { fetchMenus, createMenu } from "@/lib/supabase";

async function isAuthorized(): Promise<boolean> {
  const store = await cookies();
  const token = store.get(COOKIE_NAME)?.value;
  return verifyToken(token, process.env.ADMIN_PASSWORD);
}

export async function GET() {
  if (!await isAuthorized())
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const menus = await fetchMenus();
  return NextResponse.json(menus);
}

export async function POST(request: Request) {
  if (!await isAuthorized())
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json().catch(() => ({}));
  const { name, price, description } = body as Record<string, unknown>;

  if (!name || typeof name !== "string" || !name.trim())
    return NextResponse.json({ error: "メニュー名は必須です" }, { status: 400 });

  const priceNum = Number(price);
  if (!Number.isInteger(priceNum) || priceNum < 0)
    return NextResponse.json({ error: "料金は0以上の整数を入力してください" }, { status: 400 });

  const desc = typeof description === "string" ? description.trim() || null : null;

  await createMenu({ name: name.trim(), price: priceNum, description: desc });
  return NextResponse.json({ ok: true }, { status: 201 });
}
