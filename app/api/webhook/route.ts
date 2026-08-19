import { verifyLineSignature } from "@/lib/line/signature";
import { sendReply } from "@/lib/line/reply";
import type { LineWebhookBody, LineEvent, LineMessageEvent } from "@/lib/line/types";

export const runtime = "nodejs";

export async function POST(request: Request): Promise<Response> {
  const channelSecret = process.env.LINE_CHANNEL_SECRET;
  const accessToken = process.env.LINE_CHANNEL_ACCESS_TOKEN;

  if (!channelSecret || !accessToken) {
    console.error("[webhook] Missing LINE env vars");
    return new Response("OK", { status: 200 });
  }

  const rawBody = await request.text();
  console.log("[webhook] Raw body received:", rawBody.slice(0, 200));

  const signature = request.headers.get("x-line-signature");
  if (!signature || !verifyLineSignature(rawBody, signature, channelSecret)) {
    console.error("[webhook] Signature verification failed. signature:", signature);
    return new Response("Unauthorized", { status: 401 });
  }

  const { events } = JSON.parse(rawBody) as LineWebhookBody;
  console.log("[webhook] Events count:", events.length);

  // Vercelサーバーレスはレスポンス返却後に実行コンテキストが終了するため await が必須
  await processEvents(events, accessToken);

  return new Response("OK", { status: 200 });
}

async function processEvents(events: LineEvent[], accessToken: string) {
  for (const event of events) {
    console.log("[webhook] Processing event type:", event.type);

    console.log("[webhook] Event detail:", JSON.stringify(event, null, 2));

    if (event.type === "message") {
      const e = event as LineMessageEvent;
      console.log("[webhook] userId:", e.source.userId);
      console.log("[webhook] Message type:", e.message.type);

      if (e.message.type === "text" && "text" in e.message) {
        console.log("[webhook] Sending reply:", e.message.text);
        try {
          await sendReply(e.replyToken, e.message.text, accessToken);
          console.log("[webhook] Reply sent successfully");
        } catch (err) {
          console.error("[webhook] Reply failed:", err);
        }
      }
    }
  }
}
