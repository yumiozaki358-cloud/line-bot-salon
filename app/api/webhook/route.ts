import { verifyLineSignature } from "@/lib/line/signature";
import { sendReply } from "@/lib/line/reply";
import type { LineWebhookBody, LineEvent, LineMessageEvent } from "@/lib/line/types";

export const runtime = "nodejs";

export async function POST(request: Request): Promise<Response> {
  const channelSecret = process.env.LINE_CHANNEL_SECRET;
  const accessToken = process.env.LINE_CHANNEL_ACCESS_TOKEN;

  if (!channelSecret || !accessToken) {
    console.error("Missing LINE env vars");
    return new Response("OK", { status: 200 });
  }

  const rawBody = await request.text();

  const signature = request.headers.get("x-line-signature");
  if (!signature || !verifyLineSignature(rawBody, signature, channelSecret)) {
    return new Response("Unauthorized", { status: 401 });
  }

  const { events } = JSON.parse(rawBody) as LineWebhookBody;

  processEvents(events, accessToken).catch((err) =>
    console.error("Event processing error:", err)
  );

  return new Response("OK", { status: 200 });
}

async function processEvents(events: LineEvent[], accessToken: string) {
  for (const event of events) {
    if (event.type === "message") {
      const e = event as LineMessageEvent;
      if (e.message.type === "text" && "text" in e.message) {
        await sendReply(e.replyToken, e.message.text, accessToken).catch(
          (err) => console.error("Reply failed:", err)
        );
      }
    }
  }
}
