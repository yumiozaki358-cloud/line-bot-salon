const REPLY_API_URL = "https://api.line.me/v2/bot/message/reply";

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
