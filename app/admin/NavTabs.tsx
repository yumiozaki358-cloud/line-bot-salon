"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const tabs = [
  { href: "/admin/faq", label: "質問と回答" },
  { href: "/admin/menu", label: "メニュー" },
];

export default function NavTabs() {
  const pathname = usePathname();

  return (
    <nav className="flex gap-1 pt-2">
      {tabs.map((tab) => (
        <Link
          key={tab.href}
          href={tab.href}
          className={`px-4 py-3 text-base font-medium border-b-2 transition-colors ${
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
