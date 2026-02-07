"use client";

import { useEffect, useState } from "react";

export default function AdminBookings() {

  const [bookings, setBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);


  // Fetch bookings
  useEffect(() => {

    async function load() {
      try {
        const res = await fetch("/api/admin/bookings");
        const data = await res.json();

        setBookings(Array.isArray(data) ? data : []);

      } catch (err) {
        console.error(err);
        setBookings([]);

      } finally {
        setLoading(false);
      }
    }

    load();

  }, []);


  // Update status
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

      alert("Updated Successfully ✅");

    } catch (err) {
      console.error(err);
      alert("Server Error ❌");
    }
  }


  // Loading UI
  if (loading) {
    return (
      <div className="p-6 text-center text-white">
        Loading...
      </div>
    );
  }


  return (
    <div className="container py-6 px-3 sm:px-4 text-white overflow-x-hidden">

      {/* Header */}
      <h1 className="
        text-2xl md:text-3xl
        font-bold mb-6
        gradient-text
        text-center md:text-left
      ">
        📋 Admin Booking Panel
      </h1>


      {/* Empty */}
      {bookings.length === 0 && (
        <p className="text-center text-gray-400">
          No bookings found
        </p>
      )}


      {/* Cards Wrapper */}
      <div className="space-y-4 max-w-4xl mx-auto px-1 sm:px-0">


        {bookings.map((b) => (

          <div
            key={b._id}
            className="
              card-safe
              p-3 sm:p-4
              rounded-xl

              w-full
              max-w-full
              overflow-hidden

              grid
              grid-cols-1
              md:grid-cols-[1fr_auto]

              gap-4
              items-center
            "
          >

            {/* INFO */}
            <div
              className="
                text-sm

                grid
                grid-cols-1
                sm:grid-cols-2
                lg:grid-cols-3

                gap-x-6
                gap-y-1
              "
            >

              <p><b>Name:</b> {b.name}</p>

              <p><b>Phone:</b> {b.phone}</p>

              {b.altPhone && (
                <p><b>Alt:</b> {b.altPhone}</p>
              )}

              <p>
                <b>Route:</b>{" "}
                <span className="text-blue-400">
                  {b.pickup} → {b.drop}
                </span>
              </p>

              <p><b>Date:</b> {b.date}</p>

              <p><b>Time:</b> {b.time}</p>

              <p>
                <b>Price:</b>{" "}
                <span className="text-green-400 font-semibold">
                  ₹{b.price}
                </span>
              </p>

              <p>
                <b>Status:</b>{" "}
                <span
                  className={`font-semibold
                    ${
                      b.status === "pending"
                        ? "text-yellow-400"
                        : b.status === "confirmed"
                        ? "text-green-400"
                        : "text-red-400"
                    }
                  `}
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


            {/* BUTTONS */}
            <div
              className="
                flex
                flex-col
                sm:flex-row
                md:flex-col

                gap-2

                w-full
                md:w-auto

                items-stretch
                justify-center
              "
            >

              {b.status === "pending" && (
                <>

                  {/* Accept */}
                  <button
                    onClick={() =>
                      updateStatus(b._id, "confirmed")
                    }
                    className="
                      btn-primary
                      bg-green-600 hover:bg-green-700
                      rounded-xl
                      w-full
                      py-2
                      text-sm
                      text-center

                      sm:min-w-[90px]
                    "
                  >
                    Accept
                  </button>


                  {/* Reject */}
                  <button
                    onClick={() =>
                      updateStatus(b._id, "rejected")
                    }
                    className="
                      btn-primary
                      bg-red-600 hover:bg-red-700
                      rounded-xl
                      w-full
                      py-2
                      text-sm
                      text-center

                      sm:min-w-[90px]
                    "
                  >
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
