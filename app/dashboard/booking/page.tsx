"use client";

import { useEffect, useState } from "react";

export default function UserBookings() {

  const [bookings, setBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {

    async function loadBookings() {

      try {

        const res = await fetch("/api/booking/user");

        if (res.status === 401) {
          window.location.href = "/login";
          return;
        }

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

    loadBookings();

  }, []);

  if (loading) {
    return <p className="p-6">Loading...</p>;
  }

  return (
    <div className="p-6 space-y-4 text-white">

      <h1 className="text-2xl font-bold mb-4">
        My Bookings
      </h1>

      {bookings.length === 0 && (
        <p>No bookings found</p>
      )}

      {bookings.map((b: any) => (

        <div
          key={b._id}
          className="card-safe p-4 space-y-2 text-sm"
        >

          <p>
            <b>Route:</b> {b.route}
          </p>

          <p>
            <b>Price:</b> ₹{b.price}
          </p>

          <p>
            <b>Date:</b>{" "}
            {new Date(b.createdAt).toLocaleDateString()}
          </p>

          <p>
            <b>Status:</b>{" "}
            <span
              className={
                b.status === "confirmed"
                  ? "text-green-400"
                  : b.status === "rejected"
                  ? "text-red-400"
                  : "text-yellow-400"
              }
            >
              {b.status}
            </span>
          </p>

        </div>
      ))}

    </div>
  );
}
