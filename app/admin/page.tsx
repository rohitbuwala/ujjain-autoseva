export default function AdminPage() {
  return (
    <div>

      <h1 className="text-3xl font-bold mb-6">
        Admin Dashboard
      </h1>

      <div className="grid md:grid-cols-3 gap-6">

        <div className="bg-white/10 p-5 rounded-xl">
          📦 Total Services
        </div>

        <div className="bg-white/10 p-5 rounded-xl">
          📑 Total Bookings
        </div>

        <div className="bg-white/10 p-5 rounded-xl">
          👤 Total Users
        </div>

      </div>

    </div>
  );
}
