"use client";

import { useState } from "react";
import type { BroadcastRecord } from "@/lib/supabase";

type Step = "compose" | "preview" | "confirm" | "sending" | "done" | "error";

function Spinner() {
  return (
    <span className="inline-block w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin shrink-0" />
  );
}

function formatSentAt(dateStr: string): string {
  const d = new Date(dateStr);
  const month = d.getMonth() + 1;
  const day = d.getDate();
  const hour = String(d.getHours()).padStart(2, "0");
  const min = String(d.getMinutes()).padStart(2, "0");
  return `${month}/${day} ${hour}:${min}`;
}

function LinePreview({ text }: { text: string }) {
  return (
    <div className="rounded-xl overflow-hidden">
      <div className="bg-[#8fcc6a] px-3 py-2">
        <p className="text-xs text-white/80 text-center">プレビュー（受信側の見た目）</p>
      </div>
      <div className="bg-[#88c47e] p-4 min-h-[80px]">
        <div className="flex items-start gap-2">
          <div className="w-8 h-8 rounded-full bg-white/50 shrink-0 mt-0.5" />
          <div className="bg-white rounded-xl rounded-tl-none px-3 py-2 shadow-sm max-w-[85%]">
            <p className="text-sm text-gray-900 leading-relaxed whitespace-pre-wrap">{text}</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function BroadcastForm({
  followerCount,
  initialHistory,
}: {
  followerCount: number | null;
  initialHistory: BroadcastRecord[];
}) {
  const [text, setText] = useState("");
  const [step, setStep] = useState<Step>("compose");
  const [errorMsg, setErrorMsg] = useState("");
  const [history, setHistory] = useState<BroadcastRecord[]>(initialHistory);

  const recipientLabel =
    followerCount !== null
      ? `友だち全員（${followerCount.toLocaleString("ja-JP")}人）`
      : "登録されている全員";

  async function handleSend() {
    setStep("sending");
    try {
      const res = await fetch("/api/admin/broadcast", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: text, recipientCount: followerCount }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({})) as { error?: string };
        throw new Error(data.error ?? "送信に失敗しました");
      }
      setHistory((prev) => [
        {
          id: Date.now(),
          message: text,
          sent_at: new Date().toISOString(),
          recipient_count: followerCount,
        },
        ...prev,
      ]);
      setText("");
      setStep("done");
    } catch (err) {
      setErrorMsg(
        err instanceof Error
          ? err.message
          : "送信に失敗しました。時間をおいて再度お試しください。"
      );
      setStep("error");
    }
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 space-y-4">
      {/* Compose */}
      {step === "compose" && (
        <div className="bg-white rounded-xl shadow p-4 space-y-3">
          <p className="text-base font-medium text-gray-800">お知らせ内容を入力</p>
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="例：明日10月12日（土）は臨時休業いたします。ご不便をおかけして申し訳ございません。"
            rows={5}
            className="w-full rounded-xl border border-gray-300 px-4 py-3 text-base text-gray-900 placeholder:text-gray-400 resize-none focus:outline-none focus:ring-2 focus:ring-blue-400"
          />
          <button
            onClick={() => setStep("preview")}
            disabled={!text.trim()}
            className="w-full bg-blue-600 text-white rounded-xl py-3 text-base font-medium min-h-[44px] disabled:opacity-40"
          >
            プレビューを見る
          </button>
        </div>
      )}

      {/* Preview */}
      {step === "preview" && (
        <div className="space-y-3">
          <div className="bg-white rounded-xl shadow p-4 space-y-3">
            <p className="text-base font-medium text-gray-800">お知らせ内容</p>
            <p className="text-base text-gray-700 leading-relaxed whitespace-pre-wrap">{text}</p>
          </div>
          <LinePreview text={text} />
          <button
            onClick={() => setStep("confirm")}
            className="w-full bg-green-600 text-white rounded-xl py-3 text-base font-medium min-h-[44px]"
          >
            この内容で送信する
          </button>
          <button
            onClick={() => setStep("compose")}
            className="w-full bg-gray-100 text-gray-700 rounded-xl py-3 text-base font-medium min-h-[44px]"
          >
            編集に戻る
          </button>
        </div>
      )}

      {/* Confirm */}
      {step === "confirm" && (
        <div className="bg-white rounded-xl shadow p-5 space-y-4">
          <p className="text-base font-bold text-gray-800">送信の最終確認</p>
          <p className="text-base text-gray-700 leading-relaxed">
            {recipientLabel}に送信します。
            <br />
            この操作は取り消せません。本当に送信しますか？
          </p>
          <div className="bg-gray-50 border border-gray-200 rounded-xl p-3">
            <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">{text}</p>
          </div>
          <div className="space-y-2 pt-1">
            <button
              onClick={handleSend}
              className="w-full bg-green-600 text-white rounded-xl py-3 text-base font-bold min-h-[44px]"
            >
              送信する
            </button>
            <button
              onClick={() => setStep("preview")}
              className="w-full bg-gray-100 text-gray-700 rounded-xl py-3 text-base font-medium min-h-[44px]"
            >
              キャンセル
            </button>
          </div>
        </div>
      )}

      {/* Sending */}
      {step === "sending" && (
        <div className="bg-white rounded-xl shadow p-5 flex items-center justify-center gap-3 min-h-[120px]">
          <Spinner />
          <p className="text-base text-gray-600">送信中...</p>
        </div>
      )}

      {/* Done */}
      {step === "done" && (
        <div className="bg-green-50 border border-green-200 rounded-xl shadow p-5 space-y-4">
          <p className="text-base font-bold text-green-700">送信しました</p>
          <p className="text-sm text-gray-600">{recipientLabel}にお知らせを送信しました。</p>
          <button
            onClick={() => setStep("compose")}
            className="w-full bg-gray-100 text-gray-700 rounded-xl py-3 text-base font-medium min-h-[44px]"
          >
            新しいお知らせを作成
          </button>
        </div>
      )}

      {/* Error */}
      {step === "error" && (
        <div className="bg-red-50 border border-red-200 rounded-xl shadow p-5 space-y-4">
          <p className="text-base font-bold text-red-700">送信に失敗しました</p>
          <p className="text-sm text-gray-600">
            {errorMsg || "時間をおいて再度お試しください。"}
          </p>
          <button
            onClick={() => setStep("preview")}
            className="w-full bg-gray-100 text-gray-700 rounded-xl py-3 text-base font-medium min-h-[44px]"
          >
            戻る
          </button>
        </div>
      )}

      {/* Send history */}
      {history.length > 0 && (
        <div className="space-y-3 pt-2">
          <p className="text-sm font-medium text-gray-500">送信履歴</p>
          {history.map((item) => (
            <div key={item.id} className="bg-white rounded-xl shadow p-4 space-y-1">
              <div className="flex items-center justify-between gap-3">
                <span className="text-sm text-gray-500 shrink-0">
                  {formatSentAt(item.sent_at)}
                </span>
                {item.recipient_count !== null && (
                  <span className="text-sm text-gray-400 shrink-0">
                    {item.recipient_count.toLocaleString("ja-JP")}人
                  </span>
                )}
              </div>
              <p className="text-base text-gray-800 leading-relaxed line-clamp-2">
                {item.message}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
