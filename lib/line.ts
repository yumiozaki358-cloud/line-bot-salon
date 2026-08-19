const REPLY_API_URL = "https://api.line.me/v2/bot/message/reply";
const PUSH_API_URL = "https://api.line.me/v2/bot/message/push";

export async function sendReply(
  replyToken: string,
  text: string,
  accessToken: string
): Promise<void> {
  const res = await fetch(REPLY_API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify({
      replyToken,
      messages: [{ type: "text", text }],
    }),
  });

  if (!res.ok) {
    const detail = await res.text();
    throw new Error(`LINE Reply API ${res.status}: ${detail}`);
  }
}

export async function sendPush(
  to: string,
  text: string,
  accessToken: string
): Promise<void> {
  const res = await fetch(PUSH_API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify({
      to,
      messages: [{ type: "text", text }],
    }),
  });

  if (!res.ok) {
    const detail = await res.text();
    throw new Error(`LINE Push API ${res.status}: ${detail}`);
  }
}
