"use client";

import { useState } from "react";

interface FaqRecord {
  id: number;
  question: string;
  answer: string;
  category: string;
}

interface FormState {
  question: string;
  answer: string;
  category: string;
}

const emptyForm: FormState = { question: "", answer: "", category: "" };

function isFormValid(f: FormState) {
  return f.question.trim() && f.answer.trim() && f.category.trim();
}

function Spinner() {
  return (
    <span className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin shrink-0" />
  );
}

function FormFields({
  form,
  onChange,
}: {
  form: FormState;
  onChange: (f: FormState) => void;
}) {
  return (
    <div className="space-y-3">
      <div>
        <label className="block text-sm text-gray-500 mb-1">カテゴリ</label>
        <input
          type="text"
          value={form.category}
          onChange={(e) => onChange({ ...form, category: e.target.value })}
          placeholder="例：営業案内"
          className="w-full border border-gray-300 rounded-xl px-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-blue-400"
        />
      </div>
      <div>
        <label className="block text-sm text-gray-500 mb-1">質問</label>
        <input
          type="text"
          value={form.question}
          onChange={(e) => onChange({ ...form, question: e.target.value })}
          placeholder="例：営業時間は？"
          className="w-full border border-gray-300 rounded-xl px-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-blue-400"
        />
      </div>
      <div>
        <label className="block text-sm text-gray-500 mb-1">回答</label>
        <textarea
          value={form.answer}
          onChange={(e) => onChange({ ...form, answer: e.target.value })}
          placeholder="例：平日10:00〜19:00、土日9:00〜18:00（火曜定休）"
          rows={3}
          className="w-full border border-gray-300 rounded-xl px-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-blue-400 resize-none"
        />
      </div>
    </div>
  );
}

export default function FaqManager({ initialFaqs }: { initialFaqs: FaqRecord[] }) {
  const [faqs, setFaqs] = useState<FaqRecord[]>(initialFaqs);
  const [showAdd, setShowAdd] = useState(false);
  const [addForm, setAddForm] = useState<FormState>(emptyForm);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editForm, setEditForm] = useState<FormState>(emptyForm);
  const [confirmDeleteId, setConfirmDeleteId] = useState<number | null>(null);
  const [savingNew, setSavingNew] = useState(false);
  const [savingEditId, setSavingEditId] = useState<number | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  function startEdit(faq: FaqRecord) {
    setEditingId(faq.id);
    setEditForm({ question: faq.question, answer: faq.answer, category: faq.category });
    setConfirmDeleteId(null);
    setShowAdd(false);
  }

  function cancelEdit() {
    setEditingId(null);
    setEditForm(emptyForm);
  }

  async function handleAdd() {
    setSavingNew(true);
    try {
      const res = await fetch("/api/admin/faq", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(addForm),
      });
      if (!res.ok) throw new Error(await res.text());
      // 新規IDを取得するためリスト全件再取得
      const refreshed: FaqRecord[] = await fetch("/api/admin/faq").then((r) => r.json());
      setFaqs(refreshed);
      setAddForm(emptyForm);
      setShowAdd(false);
    } catch {
      alert("保存に失敗しました。もう一度お試しください。");
    } finally {
      setSavingNew(false);
    }
  }

  async function handleEditSave(id: number) {
    setSavingEditId(id);
    try {
      const res = await fetch(`/api/admin/faq/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editForm),
      });
      if (!res.ok) throw new Error(await res.text());
      setFaqs(faqs.map((f) => (f.id === id ? { id, ...editForm } : f)));
      setEditingId(null);
    } catch {
      alert("保存に失敗しました。もう一度お試しください。");
    } finally {
      setSavingEditId(null);
    }
  }

  async function handleDelete(id: number) {
    setDeletingId(id);
    try {
      const res = await fetch(`/api/admin/faq/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error(await res.text());
      setFaqs(faqs.filter((f) => f.id !== id));
      setConfirmDeleteId(null);
    } catch {
      alert("削除に失敗しました。もう一度お試しください。");
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 space-y-4">
      {/* 追加ボタン */}
      {!showAdd && (
        <button
          onClick={() => {
            setShowAdd(true);
            setEditingId(null);
            setConfirmDeleteId(null);
          }}
          className="w-full bg-blue-600 text-white rounded-xl py-3 text-base font-medium min-h-[44px]"
        >
          ＋ 新しい質問と回答を追加
        </button>
      )}

      {/* 追加フォーム */}
      {showAdd && (
        <div className="bg-white rounded-xl shadow p-4 space-y-4 border-2 border-blue-200">
          <p className="text-base font-medium text-gray-700">新規追加</p>
          <FormFields form={addForm} onChange={setAddForm} />
          <div className="flex gap-3">
            <button
              onClick={handleAdd}
              disabled={savingNew || !isFormValid(addForm)}
              className="flex-1 bg-blue-600 text-white rounded-xl py-3 text-base font-medium min-h-[44px] disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {savingNew && <Spinner />}
              保存する
            </button>
            <button
              onClick={() => {
                setShowAdd(false);
                setAddForm(emptyForm);
              }}
              disabled={savingNew}
              className="flex-1 bg-gray-100 text-gray-700 rounded-xl py-3 text-base font-medium min-h-[44px]"
            >
              キャンセル
            </button>
          </div>
        </div>
      )}

      {/* FAQ一覧 */}
      {faqs.length === 0 ? (
        <p className="text-center text-gray-500 py-10 text-base">
          質問と回答がまだ登録されていません
        </p>
      ) : (
        faqs.map((faq) => (
          <div key={faq.id} className="bg-white rounded-xl shadow p-4 space-y-3">
            {editingId === faq.id ? (
              /* 編集フォーム */
              <>
                <p className="text-base font-medium text-gray-700">編集中</p>
                <FormFields form={editForm} onChange={setEditForm} />
                <div className="flex gap-3">
                  <button
                    onClick={() => handleEditSave(faq.id)}
                    disabled={savingEditId === faq.id || !isFormValid(editForm)}
                    className="flex-1 bg-blue-600 text-white rounded-xl py-3 text-base font-medium min-h-[44px] disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {savingEditId === faq.id && <Spinner />}
                    保存する
                  </button>
                  <button
                    onClick={cancelEdit}
                    disabled={savingEditId === faq.id}
                    className="flex-1 bg-gray-100 text-gray-700 rounded-xl py-3 text-base font-medium min-h-[44px]"
                  >
                    キャンセル
                  </button>
                </div>
              </>
            ) : (
              /* 表示モード */
              <>
                <span className="inline-block bg-gray-100 text-gray-600 text-sm px-3 py-1 rounded-full">
                  {faq.category}
                </span>
                <div className="space-y-1">
                  <p className="text-base font-medium text-gray-800">{faq.question}</p>
                  <p className="text-base text-gray-600 leading-relaxed">{faq.answer}</p>
                </div>

                {confirmDeleteId === faq.id ? (
                  /* 削除確認 */
                  <div className="bg-red-50 rounded-xl p-3 space-y-3">
                    <p className="text-base text-red-700 font-medium">
                      本当に削除しますか？
                    </p>
                    <div className="flex gap-3">
                      <button
                        onClick={() => handleDelete(faq.id)}
                        disabled={deletingId === faq.id}
                        className="flex-1 bg-red-600 text-white rounded-xl py-3 text-base font-medium min-h-[44px] disabled:opacity-50 flex items-center justify-center gap-2"
                      >
                        {deletingId === faq.id && <Spinner />}
                        はい、削除する
                      </button>
                      <button
                        onClick={() => setConfirmDeleteId(null)}
                        disabled={deletingId === faq.id}
                        className="flex-1 bg-gray-100 text-gray-700 rounded-xl py-3 text-base font-medium min-h-[44px]"
                      >
                        キャンセル
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex gap-3 pt-1">
                    <button
                      onClick={() => startEdit(faq)}
                      className="flex-1 border border-gray-300 text-gray-700 rounded-xl py-3 text-base font-medium min-h-[44px]"
                    >
                      編集
                    </button>
                    <button
                      onClick={() => {
                        setConfirmDeleteId(faq.id);
                        setEditingId(null);
                      }}
                      className="flex-1 border border-red-300 text-red-600 rounded-xl py-3 text-base font-medium min-h-[44px]"
                    >
                      削除
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        ))
      )}
    </div>
  );
}
