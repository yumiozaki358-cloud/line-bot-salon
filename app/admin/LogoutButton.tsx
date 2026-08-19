"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function LogoutButton() {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleLogout() {
    setLoading(true);
    await fetch("/api/admin/logout", { method: "POST" });
    router.push("/admin");
  }

  return (
    <button
      onClick={handleLogout}
      disabled={loading}
      className="text-gray-500 text-base min-h-[44px] px-3 disabled:opacity-50"
    >
      {loading ? "..." : "ログアウト"}
    </button>
  );
}
