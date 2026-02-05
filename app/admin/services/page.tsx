"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";

export default function AdminServices() {

  const [services, setServices] = useState<any[]>([]);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    const res = await fetch("/api/services");
    const data = await res.json();
    setServices(data);
  };

  const deleteService = async (id: string) => {
    await fetch(`/api/services/${id}`, {
      method: "DELETE",
    });

    loadData();
  };

  return (
    <div>

      <div className="flex justify-between mb-6">

        <h1 className="text-2xl font-bold">
          Manage Services
        </h1>

        <Button
          className="btn-gradient"
          onClick={() => location.href = "/admin/services/add"}
        >
          + Add Service
        </Button>

      </div>

      <div className="space-y-4">

        {services.map((s) => (

          <div
            key={s._id}
            className="bg-white/10 p-4 rounded-lg flex justify-between items-center"
          >

            <div>
              <b>{s.from} → {s.to}</b>
              <p className="text-sm text-gray-300">
                ₹{s.price} | {s.type}
              </p>
            </div>

            <div className="space-x-2">

              <Button
                size="sm"
                onClick={() =>
                  location.href = `/admin/services/edit/${s._id}`
                }
              >
                Edit
              </Button>

              <Button
                size="sm"
                variant="destructive"
                onClick={() => deleteService(s._id)}
              >
                Delete
              </Button>

            </div>

          </div>

        ))}

      </div>

    </div>
  );
}
