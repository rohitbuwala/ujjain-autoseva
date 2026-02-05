export default function AdminLayout({ children }: any) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-black via-blue-950 to-purple-950 text-white">

      {/* Header */}
      <div className="bg-black/50 border-b border-white/10 p-4 text-xl font-bold">
        🛠 Admin Panel - Ujjain AutoSeva
      </div>

      <div className="flex">

        {/* Sidebar */}
        <aside className="w-64 bg-black/40 min-h-screen p-4 space-y-3">

          <a href="/admin" className="block hover:text-yellow-400">
            Dashboard
          </a>

          <a href="/admin/services" className="block hover:text-yellow-400">
            Manage Services
          </a>

          <a href="/admin/bookings" className="block hover:text-yellow-400">
            Bookings
          </a>

        </aside>

        {/* Content */}
        <main className="flex-1 p-6">
          {children}
        </main>

      </div>
    </div>
  );
}
