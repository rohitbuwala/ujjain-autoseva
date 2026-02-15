"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";

export default function AddService() {

  const router = useRouter();

  const [form, setForm] = useState({
    route: "",
    time: "",
    price: "",
    category: "inside",
    description: "",
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  function handleChange(e: any) {
    const { name, value } = e.target;

    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  }

  async function submit() {

    setError("");
    setSuccess("");

    if (!form.route || !form.time || !form.price) {
      setError("Please fill all required fields.");
      return;
    }

    if (Number(form.price) <= 0) {
      setError("Price must be greater than 0.");
      return;
    }

    setLoading(true);

    try {

      const res = await fetch("/api/services", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...form,
          price: Number(form.price),
        }),
      });

      if (!res.ok) {
        throw new Error("Failed to create service");
      }

      setSuccess("Service created successfully ✅");

      setTimeout(() => {
        router.push("/admin/services");
      }, 1200);

    } catch (err) {
      console.error(err);
      setError("Something went wrong. Please try again.");
    }

    setLoading(false);
  }

  return (
    <div className="min-h-screen bg-white dark:bg-background text-slate-900 dark:text-white px-3 sm:px-6 py-10 transition-colors">

      <div className="max-w-3xl mx-auto">

        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight">
            Add New Service
          </h1>
          <p className="text-muted-foreground mt-1">
            Create a new taxi or temple service route
          </p>
        </div>

        {/* Card */}
        <div className="rounded-xl border bg-card shadow-sm p-6 space-y-6">

          {/* Error */}
          {error && (
            <div className="bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/30 p-3 rounded-md text-sm">
              {error}
            </div>
          )}

          {/* Success */}
          {success && (
            <div className="bg-green-500/10 text-green-600 dark:text-green-400 border border-green-500/30 p-3 rounded-md text-sm">
              {success}
            </div>
          )}

          {/* Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">

            {/* Route */}
            <div className="space-y-1">
              <label className="text-sm font-medium">
                Route <span className="text-red-500">*</span>
              </label>
              <input
                name="route"
                value={form.route}
                onChange={handleChange}
                placeholder="Mahakal to Kaal Bhairav"
                className="w-full rounded-md border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary"
              />
            </div>

            {/* Time */}
            <div className="space-y-1">
              <label className="text-sm font-medium">
                Time <span className="text-red-500">*</span>
              </label>
              <input
                name="time"
                value={form.time}
                onChange={handleChange}
                placeholder="30m"
                className="w-full rounded-md border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary"
              />
            </div>

            {/* Price */}
            <div className="space-y-1">
              <label className="text-sm font-medium">
                Price (₹) <span className="text-red-500">*</span>
              </label>
              <input
                name="price"
                type="number"
                value={form.price}
                onChange={handleChange}
                placeholder="200"
                className="w-full rounded-md border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
            {/* Category */}
            <div className="space-y-2">
              <label className="text-sm font-medium">
                Category
              </label>

              <div className="grid grid-cols-2 gap-3">

                <button
                  type="button"
                  onClick={() => setForm({ ...form, category: "inside" })}
                  className={`
        border rounded-md px-3 py-2 text-sm transition
        ${form.category === "inside"
                      ? "bg-primary text-primary-foreground border-primary"
                      : "bg-background hover:bg-muted"}
      `}
                >
                  Inside City
                </button>

                <button
                  type="button"
                  onClick={() => setForm({ ...form, category: "outside" })}
                  className={`
        border rounded-md px-3 py-2 text-sm transition
        ${form.category === "outside"
                      ? "bg-primary text-primary-foreground border-primary"
                      : "bg-background hover:bg-muted"}
      `}
                >
                  Outside City
                </button>

              </div>
            </div>



          </div>

          {/* Description */}
          <div className="space-y-1">
            <label className="text-sm font-medium">
              Description
            </label>
            <textarea
              name="description"
              value={form.description}
              onChange={handleChange}
              rows={4}
              placeholder="Optional service details..."
              className="w-full rounded-md border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary resize-none"
            />
          </div>

          {/* Buttons */}
          <div className="flex flex-col sm:flex-row gap-3 pt-4">

            <Button
              onClick={submit}
              disabled={loading}
              className="flex-1"
            >
              {loading && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Save Service
            </Button>

            <Button
              variant="outline"
              onClick={() => router.push("/admin/services")}
              className="flex-1"
            >
              Cancel
            </Button>

          </div>

        </div>

      </div>

    </div>
  );
}
