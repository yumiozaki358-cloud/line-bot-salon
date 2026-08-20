import { unstable_cache } from "next/cache";
import { fetchConversations } from "@/lib/supabase";
import AdminShell from "../AdminShell";
import ConversationList from "./ConversationList";

export const dynamic = "force-dynamic";

const PAGE_SIZE = 30;

const getConversations = unstable_cache(
  (limit: number, offset: number) => fetchConversations(limit, offset),
  ["admin-conversations"],
  { revalidate: 10 }
);

export default async function ConversationsPage() {
  const items = await getConversations(PAGE_SIZE, 0);
  return (
    <AdminShell>
      <ConversationList initialItems={items} hasMoreInitial={items.length === PAGE_SIZE} />
    </AdminShell>
  );
}
