import { fetchMenus } from "@/lib/supabase";
import AdminShell from "../AdminShell";
import MenuManager from "./MenuManager";

export const dynamic = "force-dynamic";

export default async function MenuPage() {
  const menus = await fetchMenus();
  return (
    <AdminShell>
      <MenuManager initialMenus={menus} />
    </AdminShell>
  );
}
