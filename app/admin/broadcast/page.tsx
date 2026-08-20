import AdminShell from "../AdminShell";
import BroadcastForm from "./BroadcastForm";
import { getFollowerCount } from "@/lib/line";
import { fetchBroadcasts } from "@/lib/supabase";

export const dynamic = "force-dynamic";

export default async function BroadcastPage() {
  const accessToken = process.env.LINE_CHANNEL_ACCESS_TOKEN ?? "";

  const [followerResult, historyResult] = await Promise.allSettled([
    getFollowerCount(accessToken),
    fetchBroadcasts(10),
  ]);

  return (
    <AdminShell>
      <BroadcastForm
        followerCount={followerResult.status === "fulfilled" ? followerResult.value : null}
        initialHistory={historyResult.status === "fulfilled" ? historyResult.value : []}
      />
    </AdminShell>
  );
}
