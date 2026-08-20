import { unstable_cache } from "next/cache";
import { fetchMenus } from "@/lib/supabase";
import AdminShell from "../AdminShell";
import MenuManager from "./MenuManager";

export const dynamic = "force-dynamic";

const getMenus = unstable_cache(
  () => fetchMenus(),
  ["admin-menus"],
  { revalidate: 10, tags: ["menus"] }
);

export default async function MenuPage() {
  const menus = await getMenus();
  return (
    <AdminShell>
      <MenuManager initialMenus={menus} />
    </AdminShell>
  );
}
