"use client";

import { useEffect, useState } from "react";

export default function AdminBookings() {

  const [bookings, setBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // ✅ Fetch bookings
  useEffect(() => {

    async function load() {

      try {
        const res = await fetch("/api/admin/bookings");

        const data = await res.json();

        if (Array.isArray(data)) {
          setBookings(data);
        } else {
          setBookings([]);
        }

      } catch (err) {
        console.error(err);
        setBookings([]);
      } finally {
        setLoading(false);
      }
    }

    load();

  }, []);


  // ✅ Update status
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
        alert("Update Failed");
        return;
      }

      // Refresh list
      setBookings(prev =>
        prev.map(b =>
          b._id === id ? { ...b, status } : b
        )
      );

      alert("Updated ✅");

    } catch (err) {
      console.error(err);
      alert("Server Error");
    }
  }


  if (loading) {
    return <p className="p-6">Loading...</p>;
  }


  return (
    <div className="p-6 space-y-4 text-white">

      <h1 className="text-3xl font-bold mb-6">
        📋 Admin Bookings Panel
      </h1>


      {bookings.length === 0 && (
        <p>No bookings found</p>
      )}


      {bookings.map((b) => (

        <div
          key={b._id}
          className="
            card-safe p-5 rounded-xl
            flex flex-col md:flex-row
            justify-between gap-4
          "
        >

          {/* LEFT INFO */}
          <div className="space-y-1 text-sm">

            <p><b>Name:</b> {b.name}</p>

            <p><b>Phone:</b> {b.phone}</p>

            {b.altPhone && (
              <p><b>Alt Phone:</b> {b.altPhone}</p>
            )}

            <p>
              <b>Route:</b> {b.pickup} → {b.drop}
            </p>

            <p><b>Date:</b> {b.date}</p>

            <p><b>Time:</b> {b.time}</p>

            <p><b>Price:</b> ₹{b.price}</p>

            <p>
              <b>Status:</b>{" "}
              <span
                className={`
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
              <p className="text-xs text-gray-400">
                User: {b.userId.email}
              </p>
            )}

          </div>


          {/* ACTIONS */}
          <div className="flex gap-2 items-center">

            {b.status === "pending" && (
              <>

                <button
                  onClick={() => updateStatus(b._id, "confirmed")}
                  className="
                    bg-green-600 hover:bg-green-700
                    px-4 py-1 rounded
                    text-sm
                  "
                >
                  Accept
                </button>

                <button
                  onClick={() => updateStatus(b._id, "rejected")}
                  className="
                    bg-red-600 hover:bg-red-700
                    px-4 py-1 rounded
                    text-sm
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
  );
}
