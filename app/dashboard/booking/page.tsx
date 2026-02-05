"use client";

import { useEffect, useState } from "react";

export default function MyBookings() {

  const [data, setData] = useState([]);

  useEffect(() => {
    fetch("/api/booking/list")
      .then(res=>res.json())
      .then(d=>setData(d.bookings));
  }, []);

  return (
    <div className="max-w-5xl mx-auto p-6">

      <h1 className="text-2xl mb-6 gradient-text">
        My Bookings
      </h1>

      <div className="grid md:grid-cols-2 gap-6">

        {data.map((b:any)=>(
          <div key={b._id}
            className="card-safe p-4 space-y-2">

            <p><b>From:</b> {b.from}</p>
            <p><b>To:</b> {b.to}</p>
            <p><b>Date:</b> {b.date}</p>

            <p className="text-blue-400">
              {b.status}
            </p>

          </div>
        ))}

      </div>
    </div>
  );
}
