import AdminShell from "../AdminShell";

export default function Loading() {
  return (
    <AdminShell>
      <div className="max-w-2xl mx-auto px-4 py-6 space-y-4">
        <div className="h-11 bg-gray-200 rounded-xl animate-pulse" />
        {[1, 2, 3].map((i) => (
          <div key={i} className="bg-white rounded-xl shadow p-4 space-y-3">
            <div className="flex items-baseline justify-between gap-4">
              <div className="h-4 bg-gray-200 rounded animate-pulse w-1/3" />
              <div className="h-4 bg-gray-200 rounded animate-pulse w-16" />
            </div>
            <div className="h-4 bg-gray-200 rounded animate-pulse w-2/3" />
            <div className="flex gap-3 pt-1">
              <div className="flex-1 h-11 bg-gray-100 rounded-xl animate-pulse" />
              <div className="flex-1 h-11 bg-gray-100 rounded-xl animate-pulse" />
            </div>
          </div>
        ))}
      </div>
    </AdminShell>
  );
}
