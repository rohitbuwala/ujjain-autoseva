"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Loader2, Pencil, Trash2, Plus } from "lucide-react";

export default function AdminHomepage() {
  const router = useRouter();

  const [services, setServices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  /* ================= LOAD ================= */
  useEffect(() => {
    async function loadServices() {
      try {
        const res = await fetch("/api/services");
        const data = await res.json();
        setServices(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    loadServices();
  }, []);

  /* ================= DELETE ================= */
  async function deleteService(id: string) {
    if (!confirm("Are you sure you want to delete this service?")) return;

    setDeletingId(id);

    try {
      const res = await fetch("/api/services", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });

      if (res.ok) {
        setServices((prev) => prev.filter((s) => s._id !== id));
      }
    } catch (err) {
      console.error(err);
    } finally {
      setDeletingId(null);
    }
  }

  /* ================= LOADING ================= */
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="animate-spin mr-2" />
        Loading services...
      </div>
    );
  }

  return (
    <div className="min-h-screen px-4 sm:px-6 py-10 transition-colors">

      <div className="max-w-7xl mx-auto space-y-8">

        {/* ================= HEADER ================= */}
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">

          <div>
            <h1 className="text-3xl sm:text-4xl font-bold">
              Manage Services
            </h1>
            <p className="text-muted-foreground text-sm mt-1">
              Add, edit or remove taxi services
            </p>
          </div>

          <Button
            onClick={() => router.push("/admin/services/add")}
            className="
              flex items-center gap-2
              bg-primary
              hover:bg-primary/90
              text-white
              shadow-md
              transition
            "
          >
            <Plus size={18} />
            Add Service
          </Button>
        </div>

        {/* ================= EMPTY STATE ================= */}
        {services.length === 0 ? (
          <div className="rounded-xl border p-10 text-center bg-muted/40">
            <p className="text-muted-foreground">
              No services available. Click "Add Service" to create one.
            </p>
          </div>
        ) : (
          <>
            {/* ================= DESKTOP TABLE ================= */}
            <div className="hidden md:block rounded-xl border bg-card shadow-sm overflow-hidden">

              <table className="w-full text-sm">

                <thead className="border-b bg-muted/40">
                  <tr>
                    <th className="p-4 text-left">Route</th>
                    <th className="p-4 text-left">Time</th>
                    <th className="p-4 text-left">Price</th>
                    <th className="p-4 text-left">Category</th>
                    <th className="p-4 text-left">Actions</th>
                  </tr>
                </thead>

                <tbody>
                  {services.map((s) => (
                    <tr
                      key={s._id}
                      className="border-b hover:bg-muted/30 transition"
                    >
                      <td className="p-4 font-medium">
                        {s.route || `${s.from} → ${s.to}`}
                      </td>

                      <td className="p-4 text-muted-foreground">
                        {s.time}
                      </td>

                      <td className="p-4 font-semibold">
                        ₹{s.price}
                      </td>

                      <td className="p-4 capitalize">
                        <span className="
                          px-2 py-1 rounded-full text-xs
                          bg-primary/10 text-primary
                        ">
                          {s.category || "inside"}
                        </span>
                      </td>

                      <td className="p-4 flex gap-2">

                        {/* Edit */}
                        <Button
                          size="sm"
                          variant="outline"
                          className="flex gap-1 hover:bg-muted"
                          onClick={() =>
                            router.push(`/admin/services/edit/${s._id}`)
                          }
                        >
                          <Pencil size={14} />
                          Edit
                        </Button>

                        {/* Delete */}
                  <Button
                      size="sm"
                      className="
                        flex gap-1 items-center
                        bg-red-600 hover:bg-red-700
                        text-white
                        dark:bg-red-500 dark:hover:bg-red-600
                        shadow-sm
                      "
                      disabled={deletingId === s._id}
                      onClick={() => deleteService(s._id)}
                    >
                      {deletingId === s._id ? (
                        <Loader2 className="animate-spin h-4 w-4" />
                      ) : (
                        <>
                          <Trash2 size={14} />
                          Delete
                        </>
                      )}
                    </Button>


                      </td>
                    </tr>
                  ))}
                </tbody>

              </table>
            </div>

            {/* ================= MOBILE CARDS ================= */}
            <div className="md:hidden space-y-4">

              {services.map((s) => (
                <div
                  key={s._id}
                  className="rounded-xl border bg-card shadow-sm p-4 space-y-3"
                >
                  <div>
                    <h3 className="font-semibold">
                      {s.route || `${s.from} → ${s.to}`}
                    </h3>
                    <p className="text-muted-foreground text-sm">
                      {s.time}
                    </p>
                  </div>

                  <div className="flex justify-between items-center">
                    <span className="font-bold text-primary">
                      ₹{s.price}
                    </span>

                    <span className="
                      text-xs px-2 py-1 rounded-full
                      bg-primary/10 text-primary capitalize
                    ">
                      {s.category || "inside"}
                    </span>
                  </div>

                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      className="flex-1"
                      onClick={() =>
                        router.push(`/admin/services/edit/${s._id}`)
                      }
                    >
                      Edit
                    </Button>

                   <Button
                      size="sm"
                      className="
                        flex-1
                        bg-red-600 hover:bg-red-700
                        text-white
                        dark:bg-red-500 dark:hover:bg-red-600
                        shadow-sm
                      "
                      disabled={deletingId === s._id}
                      onClick={() => deleteService(s._id)}
                    >
                      {deletingId === s._id ? "Deleting..." : "Delete"}
                    </Button>

                  </div>
                </div>
              ))}

            </div>
          </>
        )}

      </div>
    </div>
  );
}
