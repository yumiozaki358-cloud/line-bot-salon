import type { FaqItem } from "@/lib/claude";

export interface FaqRecord {
  id: number;
  question: string;
  answer: string;
  category: string;
}

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

// Bot用：id不要
export async function fetchFaqs(): Promise<FaqItem[]> {
  const res = await fetch(url("faq?select=question,answer,category&order=id.asc"), {
    headers: headers(),
  });
  if (!res.ok) throw new Error(`Supabase fetchFaqs failed: ${res.status}`);
  return res.json() as Promise<FaqItem[]>;
}

// 管理画面用：id込み
export async function fetchFaqsWithId(): Promise<FaqRecord[]> {
  const res = await fetch(url("faq?select=id,question,answer,category&order=id.asc"), {
    headers: headers(),
  });
  if (!res.ok) throw new Error(`Supabase fetchFaqsWithId failed: ${res.status}`);
  return res.json() as Promise<FaqRecord[]>;
}

export async function createFaq(faq: Omit<FaqRecord, "id">): Promise<void> {
  const res = await fetch(url("faq"), {
    method: "POST",
    headers: { ...headers(), Prefer: "return=minimal" },
    body: JSON.stringify(faq),
  });
  if (!res.ok) {
    const detail = await res.text();
    throw new Error(`Supabase createFaq failed: ${res.status}: ${detail}`);
  }
}

export async function updateFaq(id: number, faq: Omit<FaqRecord, "id">): Promise<void> {
  const res = await fetch(url(`faq?id=eq.${id}`), {
    method: "PATCH",
    headers: { ...headers(), Prefer: "return=minimal" },
    body: JSON.stringify(faq),
  });
  if (!res.ok) {
    const detail = await res.text();
    throw new Error(`Supabase updateFaq failed: ${res.status}: ${detail}`);
  }
}

export async function deleteFaq(id: number): Promise<void> {
  const res = await fetch(url(`faq?id=eq.${id}`), {
    method: "DELETE",
    headers: headers(),
  });
  if (!res.ok) {
    const detail = await res.text();
    throw new Error(`Supabase deleteFaq failed: ${res.status}: ${detail}`);
  }
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
