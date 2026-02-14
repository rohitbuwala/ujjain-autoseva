"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Loader2, ArrowLeft } from "lucide-react";

export default function EditService() {
  const router = useRouter();
  const params = useParams();

  const id = Array.isArray(params?.id)
    ? params.id[0]
    : params?.id;

  const [form, setForm] = useState({
    route: "",
    time: "",
    price: "",
    category: "inside",
    description: "",
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  /* ================= LOAD ================= */

  useEffect(() => {
    if (!id) return;

    async function fetchService() {
      try {
        const res = await fetch(`/api/services/${id}`);

        if (!res.ok) throw new Error();

        const data = await res.json();

        setForm({
          route: data.route || "",
          time: data.time || "",
          price: data.price?.toString() || "",
          category: data.category || "inside",
          description: data.description || "",
        });
      } catch {
        setError("Failed to load service");
      } finally {
        setLoading(false);
      }
    }

    fetchService();
  }, [id]);

  /* ================= CHANGE ================= */

  function handleChange(
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) {
    const { name, value } = e.target;

    setForm(prev => ({
      ...prev,
      [name]: value,
    }));
  }

  /* ================= SUBMIT ================= */

  async function submit(e: React.FormEvent) {
    e.preventDefault();

    setError("");

    if (!form.route || !form.time || !form.price) {
      setError("Please fill all required fields");
      return;
    }

    if (!id) {
      setError("Invalid service ID");
      return;
    }

    setSaving(true);

    try {
      const res = await fetch(`/api/services/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          route: form.route,
          time: form.time,
          price: Number(form.price),
          category: form.category,
          description: form.description,
        }),
      });

      if (!res.ok) throw new Error();

      router.push("/admin/services");
    } catch {
      setError("Update failed. Try again.");
    } finally {
      setSaving(false);
    }
  }

  /* ================= LOADING ================= */

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="animate-spin h-6 w-6 text-primary" />
      </div>
    );
  }

  /* ================= UI ================= */

  return (
    <div className="min-h-screen bg-background px-4 py-10 overflow-x-hidden">

      <div className="max-w-2xl mx-auto">

        {/* Back Button */}
        <button
          onClick={() => router.back()}
          className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-6"
        >
          <ArrowLeft size={16} />
          Back
        </button>

        <div className="rounded-xl border bg-card shadow-sm p-6 sm:p-8 space-y-6">

          <div>
            <h1 className="text-2xl sm:text-3xl font-bold">
              Edit Service
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              Update taxi route details
            </p>
          </div>

          {error && (
            <div className="text-sm bg-red-500/10 text-red-500 p-3 rounded-md border border-red-500/20">
              {error}
            </div>
          )}

          <form onSubmit={submit} className="space-y-5">

            {/* Route */}
            <div className="space-y-2">
              <label className="text-sm font-medium">
                Route *
              </label>
              <input
                name="route"
                value={form.route}
                onChange={handleChange}
                placeholder="Mahakal to Kaal Bhairav"
                className="w-full rounded-md border bg-background px-3 py-2 text-sm focus:ring-2 focus:ring-primary outline-none"
              />
            </div>

            {/* Time */}
            <div className="space-y-2">
              <label className="text-sm font-medium">
                Time *
              </label>
              <input
                name="time"
                value={form.time}
                onChange={handleChange}
                placeholder="30m"
                className="w-full rounded-md border bg-background px-3 py-2 text-sm focus:ring-2 focus:ring-primary outline-none"
              />
            </div>

            {/* Price */}
            <div className="space-y-2">
              <label className="text-sm font-medium">
                Price (₹) *
              </label>
              <input
                name="price"
                type="number"
                value={form.price}
                onChange={handleChange}
                placeholder="200"
                className="w-full rounded-md border bg-background px-3 py-2 text-sm focus:ring-2 focus:ring-primary outline-none"
              />
            </div>

            {/* Category (Pro Style Buttons) */}
            <div className="space-y-2">
              <label className="text-sm font-medium">
                Category
              </label>

              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() =>
                    setForm({ ...form, category: "inside" })
                  }
                  className={`border rounded-md py-2 text-sm transition
                    ${
                      form.category === "inside"
                        ? "bg-primary text-primary-foreground border-primary"
                        : "bg-background hover:bg-muted"
                    }`}
                >
                  Inside City
                </button>

                <button
                  type="button"
                  onClick={() =>
                    setForm({ ...form, category: "outside" })
                  }
                  className={`border rounded-md py-2 text-sm transition
                    ${
                      form.category === "outside"
                        ? "bg-primary text-primary-foreground border-primary"
                        : "bg-background hover:bg-muted"
                    }`}
                >
                  Outside City
                </button>
              </div>
            </div>

            {/* Description */}
            <div className="space-y-2">
              <label className="text-sm font-medium">
                Description
              </label>
              <textarea
                name="description"
                value={form.description}
                onChange={handleChange}
                rows={3}
                placeholder="Short service details..."
                className="w-full rounded-md border bg-background px-3 py-2 text-sm resize-none focus:ring-2 focus:ring-primary outline-none"
              />
            </div>

            {/* Buttons */}
            <div className="flex flex-col sm:flex-row gap-3 pt-4">

              <Button
                type="submit"
                disabled={saving}
                className="flex-1"
              >
                {saving && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                Update Service
              </Button>

              <Button
                type="button"
                variant="outline"
                className="flex-1"
                onClick={() =>
                  router.push("/admin/services")
                }
              >
                Cancel
              </Button>

            </div>

          </form>

        </div>
      </div>
    </div>
  );
}
