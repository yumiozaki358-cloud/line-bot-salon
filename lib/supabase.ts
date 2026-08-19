import type { FaqItem } from "@/lib/claude";

export interface ConversationLog {
  user_id: string;
  message: string;
  bot_response: string;
  confidence: number;
  escalated: boolean;
}

function headers() {
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY!;
  return {
    "Content-Type": "application/json",
    apikey: key,
    Authorization: `Bearer ${key}`,
  };
}

function url(path: string) {
  return `${process.env.SUPABASE_URL}/rest/v1/${path}`;
}

export async function fetchFaqs(): Promise<FaqItem[]> {
  const res = await fetch(url("faq?select=question,answer,category&order=id.asc"), {
    headers: headers(),
  });
  if (!res.ok) throw new Error(`Supabase fetchFaqs failed: ${res.status}`);
  return res.json() as Promise<FaqItem[]>;
}

export async function saveConversation(log: ConversationLog): Promise<void> {
  const res = await fetch(url("conversations"), {
    method: "POST",
    headers: { ...headers(), Prefer: "return=minimal" },
    body: JSON.stringify(log),
  });
  if (!res.ok) {
    const detail = await res.text();
    throw new Error(`Supabase saveConversation failed: ${res.status}: ${detail}`);
  }
}
