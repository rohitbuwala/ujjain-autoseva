"use client";

import { useEffect, useState } from "react";

interface Booking {
  _id: string;
  name: string;
  phone: string;
  altPhone?: string;
  pickup: string;
  drop: string;
  date: string;
  time: string;
  price: string;
  status: string;
  route?: string;
  createdAt?: string;
}

export default function UserBookings() {

  const [bookings, setBookings] = useState<Booking[]>([]);
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

        setBookings(Array.isArray(data?.data) ? data.data : []);

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
    return <p className="p-6 text-center">Loading...</p>;
  }

  return (

    <div className="p-4 md:p-6 space-y-6">

      {/* HEADER */}

      <div className="flex justify-between items-center flex-wrap gap-2">
        <h1 className="text-2xl md:text-3xl font-bold">
          My Bookings
        </h1>

        <span className="text-sm bg-muted px-3 py-1 rounded-full">
          Total: {bookings.length}
        </span>
      </div>

      {/* EMPTY */}

      {bookings.length === 0 ? (

        <div className="rounded-xl border border-border p-10 text-center bg-card">
          <p className="text-lg font-medium text-muted-foreground">
            No bookings found
          </p>
          <p className="text-sm text-muted-foreground/70">
            When you book a ride, it will appear here.
          </p>
        </div>

      ) : (

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">

          {bookings.map((b) => (

            <div
              key={b._id}
              className="rounded-2xl border border-border bg-card p-5 shadow-sm hover:shadow-md transition"
            >

              {/* TOP */}

              <div className="flex justify-between items-start border-b pb-3 mb-3">

                <div className="text-xs font-semibold uppercase text-primary">
                  Ride Details
                </div>

                <span
                  className={`text-xs px-2 py-1 rounded-full font-medium capitalize ${
                    b.status === "confirmed"
                      ? "bg-green-500/10 text-green-600 dark:text-green-400"
                      : b.status === "rejected"
                      ? "bg-red-500/10 text-red-600 dark:text-red-400"
                      : "bg-yellow-500/10 text-yellow-600 dark:text-yellow-400"
                  }`}
                >
                  {b.status}
                </span>

              </div>

              {/* BODY */}

              <div className="space-y-3">

                {/* ROUTE */}

                <div className="flex gap-2">
                  <span className="text-muted-foreground w-16 text-xs uppercase shrink-0">
                    Route
                  </span>

                  <span className="text-foreground font-medium break-words leading-relaxed">
                    {b.route}
                  </span>
                </div>

                {/* PRICE */}

                <div className="flex gap-2 items-center">
                  <span className="text-muted-foreground w-16 text-xs uppercase shrink-0">
                    Price
                  </span>

                  <span className="font-bold text-lg text-primary">
                    ₹{b.price}
                  </span>
                </div>

                {/* DATE */}

                <div className="flex gap-2">
                  <span className="text-muted-foreground w-16 text-xs uppercase shrink-0">
                    Date
                  </span>

                  <span className="text-sm text-muted-foreground">
                    {b.createdAt ? new Date(b.createdAt).toLocaleDateString(undefined, {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    }) : "N/A"}
                  </span>
                </div>

              </div>

            </div>

          ))}

        </div>

      )}

    </div>
  );
}