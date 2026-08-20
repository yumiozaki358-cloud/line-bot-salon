"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const tabs = [
  { href: "/admin/faq", label: "質問と回答" },
  { href: "/admin/menu", label: "メニュー" },
  { href: "/admin/conversations", label: "会話ログ" },
  { href: "/admin/broadcast", label: "お知らせ配信" },
];

export default function NavTabs() {
  const pathname = usePathname();

  return (
    <nav className="flex gap-1 pt-2 overflow-x-auto">
      {tabs.map((tab) => (
        <Link
          key={tab.href}
          href={tab.href}
          className={`px-3 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
            pathname.startsWith(tab.href)
              ? "border-blue-600 text-blue-600"
              : "border-transparent text-gray-500"
          }`}
        >
          {tab.label}
        </Link>
      ))}
    </nav>
  );
}
