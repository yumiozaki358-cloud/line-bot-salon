import { fetchFaqsWithId } from "@/lib/supabase";
import AdminShell from "../AdminShell";
import FaqManager from "./FaqManager";

export default async function FaqPage() {
  const faqs = await fetchFaqsWithId();
  return (
    <AdminShell>
      <FaqManager initialFaqs={faqs} />
    </AdminShell>
  );
}
