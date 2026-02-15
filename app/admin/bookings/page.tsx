"use client";

import { useEffect, useState } from "react";
import {
  CheckCircle,
  XCircle,
  Phone,
  User,
  Calendar,
  Clock,
  IndianRupee,
  MapPin,
  ClipboardList,
} from "lucide-react";


export default function AdminBookings() {

  const [bookings, setBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);


  /* ================= LOAD ================= */

  useEffect(() => {

    async function load() {

      try {

        const res = await fetch("/api/admin/bookings");
        const data = await res.json();

        setBookings(Array.isArray(data.data) ? data.data : []);

      } catch (err) {

        console.error(err);
        setBookings([]);

      } finally {

        setLoading(false);

      }
    }

    load();

  }, []);


  /* ================= UPDATE ================= */

  async function updateStatus(id: string, status: string) {

    try {

      const res = await fetch(`/api/admin/bookings/${id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ status }),
      });

      if (!res.ok) {
        alert("Update Failed ❌");
        return;
      }

      setBookings(prev =>
        prev.map(b =>
          b._id === id ? { ...b, status } : b
        )
      );

      alert("Updated ✅");

    } catch (err) {

      console.error(err);
      alert("Server Error ❌");

    }
  }


  /* ================= LOADING ================= */

  if (loading) {
    return (
      <p className="text-center mt-20 text-white">
        Loading...
      </p>
    );
  }


  /* ================= UI ================= */

  return (
    <div className="min-h-screen bg-gradient-to-br from-black via-blue-950 to-purple-950 text-white px-3 sm:px-6 py-10 transition-colors">

      {/* Heading */}
      <h1 className="flex items-center justify-center gap-3
        text-2xl sm:text-4xl
        font-extrabold mb-10
        gradient-text
        text-center
      ">
        <ClipboardList size={32} className="text-blue-400" />
        Admin Bookings
      </h1>


      {/* Empty */}
      {bookings.length === 0 && (
        <p className="text-center text-gray-400">
          No bookings found
        </p>
      )}


      {/* Wrapper */}
      <div className="space-y-4 max-w-5xl mx-auto">


        {bookings.map((b) => (

          <div
            key={b._id}
            className="
              card-safe
              rounded-xl
              p-4

              grid
              grid-cols-1
              md:grid-cols-[1fr_160px]

              gap-4
              items-start
            "
          >

            {/* ================= INFO ================= */}

            <div
              className="
                text-sm

                grid
                grid-cols-1
                sm:grid-cols-2
                lg:grid-cols-3

                gap-x-6
                gap-y-2
              "
            >

              <p className="flex items-center gap-1">
                <User size={14} /> <b>Name:</b> {b.name}
              </p>

              <p className="flex items-center gap-1">
                <Phone size={14} /> <b>Phone:</b> {b.phone}
              </p>

              {b.altPhone && (
                <p className="flex items-center gap-1">
                  <Phone size={14} /> <b>Alt:</b> {b.altPhone}
                </p>
              )}

              <p className="flex items-center gap-1 sm:col-span-2">
                <MapPin size={14} />
                <b>Route:</b>
                <span className="text-blue-400 ml-1">
                  {b.pickup} → {b.drop}
                </span>
              </p>

              <p className="flex items-center gap-1">
                <Calendar size={14} /> <b>Date:</b> {b.date}
              </p>

              <p className="flex items-center gap-1">
                <Clock size={14} /> <b>Time:</b> {b.time}
              </p>

              <p className="flex items-center gap-1">
                <IndianRupee size={14} />
                <b>Price:</b>
                <span className="text-green-400 font-semibold ml-1">
                  ₹{b.price}
                </span>
              </p>

              <p className="flex items-center gap-1">
                <b>Status:</b>
                <span
                  className={`ml-1 font-semibold ${b.status === "pending"
                    ? "text-yellow-400"
                    : b.status === "confirmed"
                      ? "text-green-400"
                      : "text-red-400"
                    }`}
                >
                  {b.status}
                </span>
              </p>

              {b.userId && (
                <p className="text-xs text-gray-400 col-span-full">
                  User: {b.userId.email}
                </p>
              )}



            </div>


            {/* ================= BUTTONS ================= */}

            <div
              className="
                flex
                flex-row
                md:flex-col

                gap-2

                w-full
                md:w-auto
              "
            >

              {b.status === "pending" && (

                <>

                  <button
                    onClick={() => updateStatus(b._id, "confirmed")}
                    className="
                        w-full
                        py-2
                        rounded-lg
                        text-sm
                        bg-green-600
                        hover:bg-green-700
                        flex
                        items-center
                        justify-center
                        gap-1
                      "
                  >
                    <CheckCircle size={16} />
                    Accept
                  </button>

                  <button
                    onClick={() => updateStatus(b._id, "rejected")}
                    className="
                        w-full
                        py-2
                        rounded-lg
                        text-sm
                        bg-red-600
                        hover:bg-red-700
                        flex
                        items-center
                        justify-center
                        gap-1
                      "
                  >
                    <XCircle size={16} />
                    Reject
                  </button>


                </>

              )}

            </div>

          </div>

        ))}

      </div>

    </div>
  );
}
