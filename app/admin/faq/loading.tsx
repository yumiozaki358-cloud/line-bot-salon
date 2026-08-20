import AdminShell from "../AdminShell";

export default function Loading() {
  return (
    <AdminShell>
      <div className="max-w-2xl mx-auto px-4 py-6 space-y-4">
        <div className="h-11 bg-gray-200 rounded-xl animate-pulse" />
        {[1, 2, 3].map((i) => (
          <div key={i} className="bg-white rounded-xl shadow p-4 space-y-3">
            <div className="h-3 bg-gray-200 rounded animate-pulse w-1/4" />
            <div className="h-4 bg-gray-200 rounded animate-pulse w-3/4" />
            <div className="h-4 bg-gray-200 rounded animate-pulse w-full" />
            <div className="h-4 bg-gray-200 rounded animate-pulse w-2/3" />
          </div>
        ))}
      </div>
    </AdminShell>
  );
}
