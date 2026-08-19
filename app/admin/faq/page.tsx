import { fetchFaqsWithId } from "@/lib/supabase";
import FaqManager from "./FaqManager";
import LogoutButton from "./LogoutButton";

export default async function FaqPage() {
  const faqs = await fetchFaqsWithId();

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm sticky top-0 z-10">
        <div className="max-w-2xl mx-auto px-4 py-4 flex items-center justify-between">
          <h1 className="text-lg font-bold text-gray-800">質問と回答の管理</h1>
          <LogoutButton />
        </div>
      </header>
      <FaqManager initialFaqs={faqs} />
    </div>
  );
}
