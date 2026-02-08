"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";

import {
  PlusCircle,
  ClipboardList,
  User,
  Car,
  CheckCircle,
  LifeBuoy,
} from "lucide-react";

export default function DashboardPage() {

  const { data: session, status } = useSession();
  const router = useRouter();


  /* ================= LOADING ================= */
  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center text-gray-300">
        Loading dashboard...
      </div>
    );
  }


  /* ================= AUTH ================= */
  if (!session) {
    router.push("/login");
    return null;
  }


  return (
    <div
      className="
        min-h-screen

        px-4
        sm:px-6
        lg:px-8

        py-8
        sm:py-10
        lg:py-12
      "
    >

      {/* ================= HEADER ================= */}
      <section
        className="
          card-safe

          max-w-7xl
          mx-auto

          p-5
          sm:p-6
          lg:p-8

          mb-10

          flex
          flex-col
          md:flex-row

          items-start
          md:items-center

          justify-between

          gap-4
        "
      >

        <div>

          <h1
            className="
              text-xl
              sm:text-2xl
              lg:text-3xl

              font-bold
              gradient-text
            "
          >
            Welcome, {session.user?.name}
          </h1>

          <p className="text-gray-400 mt-1 text-sm sm:text-base">
            Manage your bookings and profile
          </p>

        </div>


        <Button
          className="btn-primary w-full sm:w-auto"
          onClick={() => router.push("/booking")}
        >
          <PlusCircle size={18} className="mr-2" />
          New Booking
        </Button>

      </section>



      {/* ================= STATS ================= */}
      <section
        className="
          max-w-7xl
          mx-auto

          grid
          grid-cols-2
          sm:grid-cols-2
          md:grid-cols-4

          gap-4
          sm:gap-6

          mb-12
        "
      >

        {[
          { title: "Total Trips", value: "12", icon: Car },
          { title: "Active Booking", value: "1", icon: ClipboardList },
          { title: "Completed", value: "10", icon: CheckCircle },
          { title: "Support Tickets", value: "2", icon: LifeBuoy },
        ].map((stat) => (

          <div
            key={stat.title}
            className="
              card-safe

              p-4
              sm:p-5

              text-center
              space-y-1
            "
          >

            <stat.icon
              size={22}
              className="mx-auto text-blue-400"
            />

            <h3 className="text-gray-400 text-xs sm:text-sm">
              {stat.title}
            </h3>

            <p className="text-xl sm:text-2xl font-bold text-white">
              {stat.value}
            </p>

          </div>
        ))}

      </section>



      {/* ================= MAIN CARDS ================= */}
      <section
        className="
          max-w-7xl
          mx-auto

          grid
          grid-cols-1
          md:grid-cols-3

          gap-5
          lg:gap-6
        "
      >

        {/* NEW BOOKING */}
        <div className="card-safe p-6 flex flex-col justify-between">

          <div>

            <h2 className="text-lg font-semibold mb-2">
              New Booking
            </h2>

            <p className="text-gray-400 text-sm mb-6">
              Book Mandir Darshan or Taxi
            </p>

          </div>

          <Button
            className="btn-primary w-full"
            onClick={() => router.push("/booking")}
          >
            <PlusCircle size={18} className="mr-2" />
            Book Now
          </Button>

        </div>


        {/* BOOKINGS */}
        <div className="card-safe p-6 flex flex-col justify-between">

          <div>

            <h2 className="text-lg font-semibold mb-2">
              My Bookings
            </h2>

            <p className="text-gray-400 text-sm mb-6">
              View your trip history
            </p>

          </div>

          <Button
            variant="outline"
            className="w-full border-blue-400 text-blue-300 hover:bg-blue-500/10"
            onClick={() => router.push("/dashboard/booking")}
          >
            <ClipboardList size={18} className="mr-2" />
            View History
          </Button>

        </div>


        {/* PROFILE */}
        <div className="card-safe p-6 flex flex-col justify-between">

          <div>

            <h2 className="text-lg font-semibold mb-2">
              My Profile
            </h2>

            <p className="text-gray-400 text-sm mb-6">
              Update personal information
            </p>

          </div>

          <Button
            variant="secondary"
            className="w-full bg-indigo-500/20 text-indigo-300 hover:bg-indigo-500/30"
            onClick={() => router.push("/dashboard/profile")}
          >
            <User size={18} className="mr-2" />
            Edit Profile
          </Button>

        </div>

      </section>

    </div>
  );
}
