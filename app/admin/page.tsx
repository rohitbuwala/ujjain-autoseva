"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

export default function AdminHomepage() {

  const router = useRouter();

  const [services, setServices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);


  // Load Services
  useEffect(() => {

    fetch("/api/services")
      .then(res => res.json())
      .then(data => {
        setServices(data);
        setLoading(false);
      });

  }, []);


  // Delete
  async function deleteService(id: string) {

    if (!confirm("Delete this service?")) return;

    await fetch("/api/services", {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ id }),
    });

    setServices(prev => prev.filter(s => s._id !== id));
  }


  if (loading) {
    return <p className="p-10 text-white">Loading...</p>;
  }


  return (
    <div className="p-6 text-white max-w-5xl mx-auto">

      {/* Header */}
      <div className="flex justify-between items-center mb-6">

        <h1 className="text-3xl font-bold">
          Manage Services
        </h1>

        <Button
          className="btn-primary"
          onClick={() => router.push("/admin/services/add")}
        >
          + Add Service
        </Button>

      </div>


      {/* Table */}
      <div className="card-safe overflow-x-auto">

        <table className="w-full text-sm">

          <thead className="border-b border-white/20">

            <tr className="text-left">

              <th className="p-3">Route</th>
              <th>Time</th>
              <th>Price</th>
              <th>Category</th>
              <th>Action</th>

            </tr>

          </thead>


          <tbody>

            {services.map((s) => (

              <tr
                key={s._id}
                className="border-b border-white/10 hover:bg-white/5"
              >

              <td className="p-3">
                 {s.route || `${s.from} to ${s.to}`}
                </td>


                <td>{s.time}</td>

                <td>₹{s.price}</td>

                <td className="capitalize">
                {s.category || "inside"}
              </td>


                <td className="space-x-2">

                  {/* Edit */}
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() =>
                      router.push(`/admin/services/edit/${s._id}`)
                    }
                  >
                    Edit
                  </Button>

                  {/* Delete */}
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => deleteService(s._id)}
                  >
                    Delete
                  </Button>

                </td>

              </tr>

            ))}

          </tbody>

        </table>

      </div>

    </div>
  );
}
