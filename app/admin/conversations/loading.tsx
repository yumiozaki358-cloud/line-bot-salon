import AdminShell from "../AdminShell";

export default function Loading() {
  return (
    <AdminShell>
      <div className="max-w-2xl mx-auto px-4 py-6 space-y-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="bg-white rounded-xl shadow p-4 space-y-3">
            <div className="flex items-center justify-between gap-3">
              <div className="h-3 bg-gray-200 rounded animate-pulse w-16" />
              <div className="h-5 bg-gray-200 rounded-full animate-pulse w-20" />
            </div>
            <div className="space-y-1.5">
              <div className="h-3 bg-gray-100 rounded animate-pulse w-8" />
              <div className="h-4 bg-gray-200 rounded animate-pulse w-3/4" />
            </div>
            <div className="space-y-1.5">
              <div className="h-3 bg-gray-100 rounded animate-pulse w-8" />
              <div className="h-4 bg-gray-200 rounded animate-pulse w-full" />
              <div className="h-4 bg-gray-200 rounded animate-pulse w-2/3" />
            </div>
          </div>
        ))}
      </div>
    </AdminShell>
  );
}
