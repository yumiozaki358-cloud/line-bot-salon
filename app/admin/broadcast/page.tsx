import { unstable_cache } from "next/cache";
import AdminShell from "../AdminShell";
import BroadcastForm from "./BroadcastForm";
import { getFollowerCount } from "@/lib/line";
import { fetchBroadcasts } from "@/lib/supabase";

export const dynamic = "force-dynamic";

const getFollowerCountCached = unstable_cache(
  () => getFollowerCount(process.env.LINE_CHANNEL_ACCESS_TOKEN ?? ""),
  ["admin-follower-count"],
  { revalidate: 3600 }
);

const getBroadcastHistory = unstable_cache(
  (limit: number) => fetchBroadcasts(limit),
  ["admin-broadcasts"],
  { revalidate: 10, tags: ["broadcasts"] }
);

export default async function BroadcastPage() {
  const [followerResult, historyResult] = await Promise.allSettled([
    getFollowerCountCached(),
    getBroadcastHistory(10),
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
