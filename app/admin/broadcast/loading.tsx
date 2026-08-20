import AdminShell from "../AdminShell";

export default function Loading() {
  return (
    <AdminShell>
      <div className="max-w-2xl mx-auto px-4 py-6 space-y-4">
        <div className="bg-white rounded-xl shadow p-4 space-y-3">
          <div className="h-4 bg-gray-200 rounded animate-pulse w-1/3" />
          <div className="h-28 bg-gray-100 rounded-xl animate-pulse" />
          <div className="h-11 bg-gray-200 rounded-xl animate-pulse" />
        </div>
        <div className="space-y-3 pt-2">
          <div className="h-3 bg-gray-200 rounded animate-pulse w-16" />
          {[1, 2].map((i) => (
            <div key={i} className="bg-white rounded-xl shadow p-4 space-y-2">
              <div className="h-3 bg-gray-200 rounded animate-pulse w-20" />
              <div className="h-4 bg-gray-200 rounded animate-pulse w-full" />
            </div>
          ))}
        </div>
      </div>
    </AdminShell>
  );
}
