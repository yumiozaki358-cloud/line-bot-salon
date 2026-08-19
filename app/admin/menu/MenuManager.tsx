"use client";

import { useState } from "react";

interface MenuItem {
  id: number;
  name: string;
  price: number;
  description: string | null;
}

interface MenuFormState {
  name: string;
  price: string;
  description: string;
}

const emptyForm: MenuFormState = { name: "", price: "", description: "" };

function isFormValid(f: MenuFormState): boolean {
  const p = Number(f.price);
  return f.name.trim().length > 0 && f.price !== "" && Number.isInteger(p) && p >= 0;
}

function formatPrice(price: number): string {
  return `¥${price.toLocaleString("ja-JP")}`;
}

function toPayload(f: MenuFormState): Omit<MenuItem, "id"> {
  return {
    name: f.name.trim(),
    price: parseInt(f.price, 10),
    description: f.description.trim() || null,
  };
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
  form: MenuFormState;
  onChange: (f: MenuFormState) => void;
}) {
  return (
    <div className="space-y-3">
      <div>
        <label className="block text-sm text-gray-500 mb-1">
          メニュー名 <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          value={form.name}
          onChange={(e) => onChange({ ...form, name: e.target.value })}
          placeholder="例：カット"
          className="w-full border border-gray-300 rounded-xl px-4 py-3 text-base text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-400"
        />
      </div>
      <div>
        <label className="block text-sm text-gray-500 mb-1">
          料金（円） <span className="text-red-500">*</span>
        </label>
        <div className="relative">
          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-base text-gray-700 pointer-events-none">
            ¥
          </span>
          <input
            type="number"
            min="0"
            step="1"
            value={form.price}
            onChange={(e) => onChange({ ...form, price: e.target.value })}
            placeholder="4500"
            className="w-full border border-gray-300 rounded-xl pl-8 pr-4 py-3 text-base text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-400"
          />
        </div>
      </div>
      <div>
        <label className="block text-sm text-gray-500 mb-1">説明（任意）</label>
        <textarea
          value={form.description}
          onChange={(e) => onChange({ ...form, description: e.target.value })}
          placeholder="例：ヘアカットのみ（シャンプー・ブロー込み）"
          rows={2}
          className="w-full border border-gray-300 rounded-xl px-4 py-3 text-base text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-400 resize-none"
        />
      </div>
    </div>
  );
}

export default function MenuManager({ initialMenus }: { initialMenus: MenuItem[] }) {
  const [menus, setMenus] = useState<MenuItem[]>(initialMenus);
  const [showAdd, setShowAdd] = useState(false);
  const [addForm, setAddForm] = useState<MenuFormState>(emptyForm);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editForm, setEditForm] = useState<MenuFormState>(emptyForm);
  const [confirmDeleteId, setConfirmDeleteId] = useState<number | null>(null);
  const [savingNew, setSavingNew] = useState(false);
  const [savingEditId, setSavingEditId] = useState<number | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  function startEdit(menu: MenuItem) {
    setEditingId(menu.id);
    setEditForm({ name: menu.name, price: String(menu.price), description: menu.description ?? "" });
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
      const res = await fetch("/api/admin/menu", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(toPayload(addForm)),
      });
      if (!res.ok) throw new Error(await res.text());
      const refreshed: MenuItem[] = await fetch("/api/admin/menu").then((r) => r.json());
      setMenus(refreshed);
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
      const data = toPayload(editForm);
      const res = await fetch(`/api/admin/menu/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error(await res.text());
      setMenus(menus.map((m) => (m.id === id ? { id, ...data } : m)));
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
      const res = await fetch(`/api/admin/menu/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error(await res.text());
      setMenus(menus.filter((m) => m.id !== id));
      setConfirmDeleteId(null);
    } catch {
      alert("削除に失敗しました。もう一度お試しください。");
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 space-y-4">
      {!showAdd && (
        <button
          onClick={() => { setShowAdd(true); setEditingId(null); setConfirmDeleteId(null); }}
          className="w-full bg-blue-600 text-white rounded-xl py-3 text-base font-medium min-h-[44px]"
        >
          ＋ 新しいメニューを追加
        </button>
      )}

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
              onClick={() => { setShowAdd(false); setAddForm(emptyForm); }}
              disabled={savingNew}
              className="flex-1 bg-gray-100 text-gray-700 rounded-xl py-3 text-base font-medium min-h-[44px]"
            >
              キャンセル
            </button>
          </div>
        </div>
      )}

      {menus.length === 0 ? (
        <p className="text-center text-gray-500 py-10 text-base">
          メニューがまだ登録されていません
        </p>
      ) : (
        menus.map((menu) => (
          <div key={menu.id} className="bg-white rounded-xl shadow p-4 space-y-3">
            {editingId === menu.id ? (
              <>
                <p className="text-base font-medium text-gray-700">編集中</p>
                <FormFields form={editForm} onChange={setEditForm} />
                <div className="flex gap-3">
                  <button
                    onClick={() => handleEditSave(menu.id)}
                    disabled={savingEditId === menu.id || !isFormValid(editForm)}
                    className="flex-1 bg-blue-600 text-white rounded-xl py-3 text-base font-medium min-h-[44px] disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {savingEditId === menu.id && <Spinner />}
                    保存する
                  </button>
                  <button
                    onClick={cancelEdit}
                    disabled={savingEditId === menu.id}
                    className="flex-1 bg-gray-100 text-gray-700 rounded-xl py-3 text-base font-medium min-h-[44px]"
                  >
                    キャンセル
                  </button>
                </div>
              </>
            ) : (
              <>
                <div className="flex items-baseline justify-between gap-4">
                  <p className="text-base font-medium text-gray-800">{menu.name}</p>
                  <p className="text-base font-bold text-blue-700 shrink-0">
                    {formatPrice(menu.price)}
                  </p>
                </div>
                {menu.description && (
                  <p className="text-base text-gray-600 leading-relaxed">{menu.description}</p>
                )}

                {confirmDeleteId === menu.id ? (
                  <div className="bg-red-50 rounded-xl p-3 space-y-3">
                    <p className="text-base text-red-700 font-medium">本当に削除しますか？</p>
                    <div className="flex gap-3">
                      <button
                        onClick={() => handleDelete(menu.id)}
                        disabled={deletingId === menu.id}
                        className="flex-1 bg-red-600 text-white rounded-xl py-3 text-base font-medium min-h-[44px] disabled:opacity-50 flex items-center justify-center gap-2"
                      >
                        {deletingId === menu.id && <Spinner />}
                        はい、削除する
                      </button>
                      <button
                        onClick={() => setConfirmDeleteId(null)}
                        disabled={deletingId === menu.id}
                        className="flex-1 bg-gray-100 text-gray-700 rounded-xl py-3 text-base font-medium min-h-[44px]"
                      >
                        キャンセル
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex gap-3 pt-1">
                    <button
                      onClick={() => startEdit(menu)}
                      className="flex-1 border border-gray-300 text-gray-700 rounded-xl py-3 text-base font-medium min-h-[44px]"
                    >
                      編集
                    </button>
                    <button
                      onClick={() => { setConfirmDeleteId(menu.id); setEditingId(null); }}
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
