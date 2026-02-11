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
    <div className="p-4 md:p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl md:text-3xl font-bold text-foreground">
          My Bookings
        </h1>
        <span className="text-sm text-muted-foreground bg-muted px-3 py-1 rounded-full">
          Total: {bookings.length}
        </span>
      </div>

      {bookings.length === 0 ? (
        <div className="card-safe p-10 text-center space-y-2">
          <p className="text-lg font-medium text-muted-foreground">No bookings found</p>
          <p className="text-sm text-muted-foreground/70">When you book a ride, it will appear here.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
          {bookings.map((b: any) => (
            <div
              key={b._id}
              className="card-safe p-5 flex flex-col justify-between"
            >
              <div className="space-y-3">
                <div className="flex justify-between items-start border-b border-border/50 pb-2 mb-2">
                  <div className="text-xs font-semibold uppercase tracking-wider text-primary">
                    Ride Details
                  </div>
                  <span
                    className={`text-xs px-2 py-1 rounded-md font-medium capitalize ${b.status === "confirmed"
                        ? "bg-green-500/10 text-green-600 dark:text-green-400"
                        : b.status === "rejected"
                          ? "bg-red-500/10 text-red-600 dark:text-red-400"
                          : "bg-yellow-500/10 text-yellow-600 dark:text-yellow-400"
                      }`}
                  >
                    {b.status}
                  </span>
                </div>

                <div className="space-y-2">
                  <p className="flex items-center gap-2 text-foreground font-medium">
                    <span className="text-muted-foreground shrink-0 w-16 text-xs uppercase">Route</span>
                    <span className="truncate">{b.route}</span>
                  </p>

                  <p className="flex items-center gap-2 text-foreground">
                    <span className="text-muted-foreground shrink-0 w-16 text-xs uppercase">Price</span>
                    <span className="font-semibold text-lg">₹{b.price}</span>
                  </p>

                  <p className="flex items-center gap-2 text-foreground/80 text-sm">
                    <span className="text-muted-foreground shrink-0 w-16 text-xs uppercase">Date</span>
                    {new Date(b.createdAt).toLocaleDateString(undefined, {
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric'
                    })}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
