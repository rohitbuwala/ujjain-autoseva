"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { FeedbackModal } from "@/components/FeedbackModal";

import {
  PlusCircle,
  ClipboardList,
  User,
  Car,
  CheckCircle,
  LifeBuoy,
  Star,
} from "lucide-react";

export default function DashboardPage() {

  const { data: session, status } = useSession();
  const router = useRouter();


  /* ================= LOADING ================= */
  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center text-muted-foreground">
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
        bg-background
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
          bg-card
          border
          border-border
          rounded-xl
          shadow-sm

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
              text-foreground
            "
          >
            Welcome, <span className="text-primary">{session.user?.name}</span>
          </h1>

          <p className="text-muted-foreground mt-1 text-sm sm:text-base">
            Manage your bookings and profile
          </p>

        </div>


        <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
          <FeedbackModal
            trigger={
              <Button variant="outline" className="w-full sm:w-auto">
                <Star className="mr-2 h-4 w-4 text-yellow-500" />
                Rate Us
              </Button>
            }
          />
          <Button
            className="w-full sm:w-auto"
            onClick={() => router.push("/booking")}
          >
            <PlusCircle size={18} className="mr-2" />
            New Booking
          </Button>
        </div>

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
              bg-card
              border
              border-border
              rounded-xl
              shadow-sm

              p-4
              sm:p-5

              text-center
              space-y-1
            "
          >

            <stat.icon
              size={22}
              className="mx-auto text-primary"
            />

            <h3 className="text-muted-foreground text-xs sm:text-sm">
              {stat.title}
            </h3>

            <p className="text-xl sm:text-2xl font-bold text-foreground">
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
        <div className="bg-card border border-border rounded-xl shadow-sm p-6 flex flex-col justify-between">

          <div>

            <h2 className="text-lg font-semibold mb-2 text-foreground">
              New Booking
            </h2>

            <p className="text-muted-foreground text-sm mb-6">
              Book Mandir Darshan or Taxi
            </p>

          </div>

          <Button
            className="w-full"
            onClick={() => router.push("/booking")}
          >
            <PlusCircle size={18} className="mr-2" />
            Book Now
          </Button>

        </div>


        {/* BOOKINGS */}
        <div className="bg-card border border-border rounded-xl shadow-sm p-6 flex flex-col justify-between">

          <div>

            <h2 className="text-lg font-semibold mb-2 text-foreground">
              My Bookings
            </h2>

            <p className="text-muted-foreground text-sm mb-6">
              View your trip history
            </p>

          </div>

          <Button
            variant="outline"
            className="w-full"
            onClick={() => router.push("/dashboard/booking")}
          >
            <ClipboardList size={18} className="mr-2" />
            View History
          </Button>

        </div>


        {/* PROFILE */}
        <div className="bg-card border border-border rounded-xl shadow-sm p-6 flex flex-col justify-between">

          <div>

            <h2 className="text-lg font-semibold mb-2 text-foreground">
              My Profile
            </h2>

            <p className="text-muted-foreground text-sm mb-6">
              Update personal information
            </p>

          </div>

          <Button
            variant="secondary"
            className="w-full"
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
