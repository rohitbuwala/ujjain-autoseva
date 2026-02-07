"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";

export default function DashboardPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  // Loading
  if (status === "loading") {
    return (
      <p className="text-center mt-20 text-gray-300">
        Loading...
      </p>
    );
  }

  // Not Logged In
  if (!session) {
    router.push("/login");
    return null;
  }

  return (
    <div className="min-h-screen px-4 py-10">

      {/* Welcome Section */}
      <section className="glass max-w-6xl mx-auto p-6 mb-10 flex flex-col md:flex-row justify-between items-center gap-4">

        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-neon">
            Welcome, {session.user?.name} 👋
          </h1>

          <p className="text-gray-400 mt-1">
            Manage your bookings and profile
          </p>
        </div>

        <Button
          className="btn-neon px-6"
          onClick={() => router.push("/booking")}
        >
          + New Booking
        </Button>

      </section>

      {/* Stats */}
      <section className="max-w-6xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-5 mb-12">

        {[
          { title: "Total Trips", value: "12" },
          { title: "Active Booking", value: "1" },
          { title: "Completed", value: "10" },
          { title: "Support Tickets", value: "2" },
        ].map((stat) => (
          <div
            key={stat.title}
            className="glass p-5 text-center"
          >
            <h3 className="text-gray-400 text-sm">
              {stat.title}
            </h3>

            <p className="text-2xl font-bold text-neon mt-1">
              {stat.value}
            </p>
          </div>
        ))}

      </section>

      {/* Main Cards */}
      <section className="max-w-6xl mx-auto grid md:grid-cols-3 gap-6">

        {/* New Booking */}
        <div className="glass p-7 flex flex-col justify-between">

          <div>
            <h2 className="text-xl font-semibold text-white mb-2">
              New Booking
            </h2>

            <p className="text-gray-400 mb-6">
              Book Mandir Darshan or Taxi
            </p>
          </div>

          <Button
            className="btn-neon w-full"
            onClick={() => router.push("/booking")}
          >
            Book Now
          </Button>

        </div>

        {/* My Bookings */}
        <div className="glass p-7 flex flex-col justify-between">

          <div>
            <h2 className="text-xl font-semibold text-white mb-2">
              My Bookings
            </h2>

            <p className="text-gray-400 mb-6">
              View your previous trips
            </p>
          </div>

          <Button
            variant="outline"
            className="border-indigo-400 text-indigo-300 hover:bg-indigo-500/20 w-full"
            onClick={() =>
              router.push("/dashboard/booking")
            }
          >
            View History
          </Button>

        </div>

        {/* Profile */}
        <div className="glass p-7 flex flex-col justify-between">

          <div>
            <h2 className="text-xl font-semibold text-white mb-2">
              My Profile
            </h2>

            <p className="text-gray-400 mb-6">
              Update your personal info
            </p>
          </div>

          <Button
            variant="secondary"
            className="bg-indigo-500/20 text-indigo-300 hover:bg-indigo-500/30 w-full"
            onClick={() =>
              router.push("/dashboard/profile")
            }
          >
            Edit Profile
          </Button>

        </div>

      </section>

    </div>
  );
}
