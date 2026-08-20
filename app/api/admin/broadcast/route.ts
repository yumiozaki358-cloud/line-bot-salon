import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { revalidateTag } from "next/cache";
import { verifyToken, COOKIE_NAME } from "@/lib/auth";
import { sendBroadcast } from "@/lib/line";
import { saveBroadcast, fetchBroadcasts } from "@/lib/supabase";

async function isAuthorized(): Promise<boolean> {
  const store = await cookies();
  const token = store.get(COOKIE_NAME)?.value;
  return verifyToken(token, process.env.ADMIN_PASSWORD);
}

export async function GET() {
  if (!await isAuthorized())
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const records = await fetchBroadcasts(20);
  return NextResponse.json(records);
}

export async function POST(request: Request) {
  if (!await isAuthorized())
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json().catch(() => ({}));
  const { message, recipientCount } = body as { message: unknown; recipientCount: unknown };

  if (!message || typeof message !== "string" || !message.trim())
    return NextResponse.json({ error: "メッセージを入力してください" }, { status: 400 });

  const accessToken = process.env.LINE_CHANNEL_ACCESS_TOKEN;
  if (!accessToken)
    return NextResponse.json({ error: "LINE設定が不完全です" }, { status: 500 });

  await sendBroadcast(message.trim(), accessToken);

  const count = typeof recipientCount === "number" ? recipientCount : null;
  await saveBroadcast(message.trim(), count).catch((err) =>
    console.error("Failed to save broadcast log:", err)
  );
  revalidateTag("broadcasts", { expire: 0 });

  return NextResponse.json({ ok: true });
}
