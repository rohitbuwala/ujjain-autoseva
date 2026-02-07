"use client";

import { useEffect, useState } from "react";

export default function AdminPage() {

  const [bookings, setBookings] = useState([]);

  useEffect(() => {
    fetch("/admin")
      .then(res => res.json())
      .then(data => setBookings(data));
  }, []);

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
      const data = await res.json();
      alert(data.error || "Update failed");
      return;
    }

    alert("Status Updated ✅");

    window.location.reload();

  } catch (err) {
    console.error(err);
    alert("Server Error");
  }
}


  return (
    <div className="p-6 text-white">

      <h1 className="text-3xl mb-5">Admin Bookings</h1>

      {bookings.map((b: any) => (

        <div
          key={b._id}
          className="border p-4 mb-3 rounded"
        >

          <p>Route: {b.route}</p>
          <p>User: {b.userId?.email}</p>
          <p>Status: {b.status}</p>

          <div className="flex gap-3 mt-2">

            {b.status === "pending" && (
  <>
    <button
      onClick={() => updateStatus(b._id, "confirmed")}
      className="bg-green-600 px-3 py-1 rounded"
    >
      Accept
    </button>

    <button
      onClick={() => updateStatus(b._id, "rejected")}
      className="bg-red-600 px-3 py-1 rounded"
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
