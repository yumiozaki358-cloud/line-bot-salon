import LogoutButton from "./LogoutButton";
import NavTabs from "./NavTabs";

export default function AdminShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm sticky top-0 z-10">
        <div className="max-w-2xl mx-auto px-4 pt-4 pb-0 flex items-center justify-between">
          <span className="text-lg font-bold text-gray-800">管理画面</span>
          <LogoutButton />
        </div>
        <div className="max-w-2xl mx-auto px-4">
          <NavTabs />
        </div>
      </header>
      {children}
    </div>
  );
}
