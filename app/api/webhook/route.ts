import { verifyLineSignature } from "@/lib/line/signature";
import { sendReply, sendPush } from "@/lib/line";
import { fetchFaqs, saveConversation } from "@/lib/supabase";
import { askClaude } from "@/lib/claude";
import type { LineWebhookBody, LineEvent, LineMessageEvent } from "@/lib/line/types";

export const runtime = "nodejs";

const ESCALATION_REPLY =
  "ご質問ありがとうございます。担当者に確認して折り返しご連絡いたします。少々お待ちください。";

export async function POST(request: Request): Promise<Response> {
  const channelSecret = process.env.LINE_CHANNEL_SECRET;
  const accessToken = process.env.LINE_CHANNEL_ACCESS_TOKEN;

  if (!channelSecret || !accessToken) {
    console.error("[webhook] Missing LINE env vars");
    return new Response("OK", { status: 200 });
  }

  const rawBody = await request.text();

  const signature = request.headers.get("x-line-signature");
  if (!signature || !verifyLineSignature(rawBody, signature, channelSecret)) {
    console.error("[webhook] Signature verification failed");
    return new Response("Unauthorized", { status: 401 });
  }

  const { events } = JSON.parse(rawBody) as LineWebhookBody;
  console.log("[webhook] Events count:", events.length);

  await processEvents(events, accessToken);

  return new Response("OK", { status: 200 });
}

async function processEvents(events: LineEvent[], accessToken: string) {
  for (const event of events) {
    console.log("[webhook] Event detail:", JSON.stringify(event, null, 2));

    if (event.type === "message") {
      const e = event as LineMessageEvent;
      if (e.message.type === "text" && "text" in e.message) {
        await handleTextMessage(e, accessToken);
      }
    }
  }
}

async function handleTextMessage(event: LineMessageEvent, accessToken: string) {
  const userMessage = (event.message as { type: "text"; text: string }).text;
  const userId = event.source.userId ?? "unknown";
  console.log("[webhook] userId:", userId, "message:", userMessage);

  let replyText = ESCALATION_REPLY;
  let confidence: "高" | "中" | "低" = "低";

  try {
    const faqs = await fetchFaqs();
    console.log("[webhook] FAQ count:", faqs.length);

    const result = await askClaude(userMessage, faqs);
    confidence = result.confidence;
    console.log("[webhook] Claude confidence:", confidence, "answer:", result.answer);

    if (confidence === "高" || confidence === "中") {
      replyText = result.answer;
    }
  } catch (err) {
    console.error("[webhook] FAQ/Claude error:", err);
    // エラー時はエスカレーション扱い（replyText と confidence はデフォルト値のまま）
  }

  // LINE返信は必ず実行
  try {
    await sendReply(event.replyToken, replyText, accessToken);
    console.log("[webhook] Reply sent. confidence:", confidence);
  } catch (err) {
    console.error("[webhook] sendReply failed:", err);
  }

  if (confidence === "低") {
    await escalate(userId, userMessage, replyText, accessToken);
  }
}

async function escalate(
  userId: string,
  userMessage: string,
  botResponse: string,
  accessToken: string
) {
  const ownerUserId = process.env.OWNER_LINE_USER_ID;

  if (ownerUserId) {
    try {
      await sendPush(
        ownerUserId,
        `未回答の質問がありました：${userMessage}`,
        accessToken
      );
      console.log("[webhook] Owner notified");
    } catch (err) {
      console.error("[webhook] sendPush to owner failed:", err);
    }
  }

  try {
    await saveConversation({
      user_id: userId,
      message: userMessage,
      bot_response: botResponse,
      confidence: "低",
      escalated: true,
    });
    console.log("[webhook] Conversation saved (escalated)");
  } catch (err) {
    console.error("[webhook] saveConversation failed:", err);
  }
}
