const REPLY_API_URL = "https://api.line.me/v2/bot/message/reply";
const PUSH_API_URL = "https://api.line.me/v2/bot/message/push";
const BROADCAST_API_URL = "https://api.line.me/v2/bot/message/broadcast";
const FOLLOWERS_INSIGHT_URL = "https://api.line.me/v2/bot/insight/followers";

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

export async function sendBroadcast(text: string, accessToken: string): Promise<void> {
  const res = await fetch(BROADCAST_API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify({
      messages: [{ type: "text", text }],
    }),
  });

  if (!res.ok) {
    const detail = await res.text();
    throw new Error(`LINE Broadcast API ${res.status}: ${detail}`);
  }
}

export async function getFollowerCount(accessToken: string): Promise<number | null> {
  // insight API requires a past date; use yesterday to get stable data
  const d = new Date();
  d.setDate(d.getDate() - 1);
  const date = `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, "0")}${String(d.getDate()).padStart(2, "0")}`;

  try {
    const res = await fetch(`${FOLLOWERS_INSIGHT_URL}?date=${date}`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    if (!res.ok) return null;
    const data = (await res.json()) as {
      status: string;
      followers?: { date: string; count: number }[];
    };
    if (data.status !== "ready" || !data.followers?.length) return null;
    return data.followers[data.followers.length - 1].count;
  } catch {
    return null;
  }
}
