"use client";

import { useState } from "react";

interface ConversationRecord {
  id: number;
  user_id: string;
  message: string;
  bot_response: string;
  confidence: number;
  escalated: boolean;
  created_at: string;
}

const PAGE_SIZE = 30;

function formatDate(dateStr: string): string {
  const d = new Date(dateStr);
  const month = d.getMonth() + 1;
  const day = d.getDate();
  const hour = String(d.getHours()).padStart(2, "0");
  const min = String(d.getMinutes()).padStart(2, "0");
  return `${month}/${day} ${hour}:${min}`;
}

function confidenceInfo(confidence: number): { label: string; badgeClass: string } {
  if (confidence >= 8)
    return { label: "自動回答", badgeClass: "bg-green-100 text-green-700" };
  if (confidence >= 6)
    return { label: "回答（要確認）", badgeClass: "bg-yellow-100 text-yellow-700" };
  return { label: "未回答・要対応", badgeClass: "bg-red-100 text-red-700" };
}

function Spinner() {
  return (
    <span className="inline-block w-4 h-4 border-2 border-gray-500 border-t-transparent rounded-full animate-spin shrink-0" />
  );
}

function ConversationCard({ item }: { item: ConversationRecord }) {
  const { label, badgeClass } = confidenceInfo(item.confidence);

  return (
    <div
      className={`rounded-xl shadow p-4 space-y-3 ${
        item.escalated
          ? "bg-amber-50 border border-amber-200"
          : "bg-white"
      }`}
    >
      <div className="flex items-center justify-between gap-3">
        <span className="text-sm text-gray-500 shrink-0">{formatDate(item.created_at)}</span>
        <span className={`text-sm font-medium px-2 py-0.5 rounded-full shrink-0 ${badgeClass}`}>
          {label}
        </span>
      </div>
      <div className="space-y-0.5">
        <p className="text-sm text-gray-500">質問</p>
        <p className="text-base text-gray-800 leading-relaxed">{item.message}</p>
      </div>
      <div className="space-y-0.5">
        <p className="text-sm text-gray-500">回答</p>
        <p className="text-base text-gray-600 leading-relaxed">{item.bot_response}</p>
      </div>
    </div>
  );
}

export default function ConversationList({
  initialItems,
  hasMoreInitial,
}: {
  initialItems: ConversationRecord[];
  hasMoreInitial: boolean;
}) {
  const [items, setItems] = useState<ConversationRecord[]>(initialItems);
  const [hasMore, setHasMore] = useState(hasMoreInitial);
  const [loading, setLoading] = useState(false);

  async function loadMore() {
    setLoading(true);
    try {
      const res = await fetch(
        `/api/admin/conversations?limit=${PAGE_SIZE}&offset=${items.length}`
      );
      if (!res.ok) throw new Error();
      const next: ConversationRecord[] = await res.json();
      setItems((prev) => [...prev, ...next]);
      setHasMore(next.length === PAGE_SIZE);
    } catch {
      alert("読み込みに失敗しました。もう一度お試しください。");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 space-y-4">
      {items.length === 0 ? (
        <p className="text-center text-gray-500 py-10 text-base">
          まだ会話ログがありません
        </p>
      ) : (
        <>
          {items.map((item) => (
            <ConversationCard key={item.id} item={item} />
          ))}
          {hasMore && (
            <button
              onClick={loadMore}
              disabled={loading}
              className="w-full bg-gray-100 text-gray-700 rounded-xl py-3 text-base font-medium min-h-[44px] disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {loading && <Spinner />}
              {loading ? "読み込み中..." : "もっと見る"}
            </button>
          )}
        </>
      )}
    </div>
  );
}
