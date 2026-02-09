"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";

type ServiceType = {
  _id: string;
  route?: string;
  from?: string;
  to?: string;
  time?: string;
  price?: number;
  category?: string;
  type?: string;
};

export default function AdminServices() {

  const [services, setServices] = useState<ServiceType[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {

    try {

      const res = await fetch("/api/services", {
        cache: "no-store",
      });

      if (!res.ok) {
        throw new Error("API Error");
      }

      const data = await res.json();

      console.log("Loaded:", data);

      if (Array.isArray(data)) {
        setServices(data);
      } else {
        setServices([]);
      }

    } catch (err) {

      console.error("Load Error:", err);
      setServices([]);

    } finally {
      setLoading(false);
    }
  };


  const deleteService = async (id: string) => {

    if (!confirm("Delete this service?")) return;

    await fetch(`/api/services/${id}`, {
      method: "DELETE",
    });

    loadData();
  };


  if (loading) {
    return <p className="text-white p-6">Loading...</p>;
  }


  return (
    <div className="p-6 text-white">

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


      {/* No Data */}
      {services.length === 0 && (
        <p className="text-gray-400 text-center mt-10">
          No services found ❌
        </p>
      )}


      <div className="space-y-4">

        {services.map((s) => (

          <div
            key={s._id}
            className="bg-white/10 p-4 rounded-lg flex justify-between items-center"
          >

            <div>

              <b>
                {s.route
                  ? s.route
                  : `${s.from ?? ""} → ${s.to ?? ""}`}
              </b>

              <p className="text-sm text-gray-300">
                ₹{s.price ?? 0} | {s.type ?? "taxi"}
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
