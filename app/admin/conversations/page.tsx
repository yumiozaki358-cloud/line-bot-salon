import { fetchConversations } from "@/lib/supabase";
import AdminShell from "../AdminShell";
import ConversationList from "./ConversationList";

export const dynamic = "force-dynamic";

const PAGE_SIZE = 30;

export default async function ConversationsPage() {
  const items = await fetchConversations(PAGE_SIZE, 0);
  return (
    <AdminShell>
      <ConversationList initialItems={items} hasMoreInitial={items.length === PAGE_SIZE} />
    </AdminShell>
  );
}
