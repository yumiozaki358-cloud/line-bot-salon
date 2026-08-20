import { unstable_cache } from "next/cache";
import { fetchFaqsWithId } from "@/lib/supabase";
import AdminShell from "../AdminShell";
import FaqManager from "./FaqManager";

export const dynamic = "force-dynamic";

const getFaqs = unstable_cache(
  () => fetchFaqsWithId(),
  ["admin-faqs"],
  { revalidate: 10, tags: ["faqs"] }
);

export default async function FaqPage() {
  const faqs = await getFaqs();
  return (
    <AdminShell>
      <FaqManager initialFaqs={faqs} />
    </AdminShell>
  );
}
