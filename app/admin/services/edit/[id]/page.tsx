"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { Button } from "@/components/ui/button";

export default function EditService() {

  const router = useRouter();
  const params = useParams();

  // ✅ Safe id
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


  /* ================= LOAD DATA ================= */

  useEffect(() => {

    if (!id) return;

    fetchService();

  }, [id]);


  async function fetchService() {

    try {

      const res = await fetch(`/api/services/${id}`);

      if (!res.ok) {
        throw new Error("Load failed");
      }

      const data = await res.json();

      setForm({
        route: data.route || "",
        time: data.time || "",
        price: data.price?.toString() || "",
        category: data.category || "inside",
        description: data.description || "",
      });

    } catch (err) {

      console.error(err);
      alert("Failed to load service ❌");

    } finally {

      setLoading(false);

    }
  }


  /* ================= CHANGE ================= */

  function handleChange(e: any) {

    const { name, value } = e.target;

    setForm(prev => ({
      ...prev,
      [name]: value,
    }));
  }


  /* ================= SUBMIT ================= */

  async function submit() {

    if (!form.route || !form.time || !form.price) {
      alert("Fill required fields ❌");
      return;
    }

    if (!id) {
      alert("Invalid Service ID ❌");
      return;
    }

    setSaving(true);

    try {

      const res = await fetch(`/api/services/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          route: form.route,
          time: form.time,
          price: Number(form.price),
          category: form.category,
          description: form.description,
        }),
      });

      if (!res.ok) {
        throw new Error("Update failed");
      }

      alert("Service Updated ✅");

      router.push("/admin/services");

    } catch (err) {

      console.error(err);
      alert("Update failed ❌");

    } finally {

      setSaving(false);

    }
  }


  /* ================= LOADING ================= */

  if (loading) {
    return (
      <p className="text-center mt-20 text-white">
        Loading...
      </p>
    );
  }


  /* ================= UI ================= */

  return (
     <div
            className="
              min-h-screen
              w-full
              flex
              justify-center
              items-center
              overflow-x-hidden   // ✅ ADD THIS
              pt-24
              px-3
              sm:px-6
              text-white
            "
          >



      <div
        className="
          w-full
          max-w-xl
          overflow-x-hidden
          mx-auto
          card-safe
          p-5
          sm:p-8
          space-y-6
        "
      >

        {/* Heading */}
        <h1 className="text-2xl sm:text-3xl font-bold text-center gradient-text">
          Edit Service
        </h1>


        {/* Route */}
        <div>
          <label className="text-sm text-gray-300">
            Route *
          </label>

          <input
            name="route"
            value={form.route}
            onChange={handleChange}
            className="input mt-1"
            placeholder="Station to Mahakal"
          />
        </div>


        {/* Time */}
        <div>
          <label className="text-sm text-gray-300">
            Time *
          </label>

          <input
            name="time"
            value={form.time}
            onChange={handleChange}
            className="input mt-1"
            placeholder="01h 30m"
          />
        </div>


        {/* Price */}
        <div>
          <label className="text-sm text-gray-300">
            Price (₹) *
          </label>

          <input
            name="price"
            type="number"
            value={form.price}
            onChange={handleChange}
            className="input mt-1"
            placeholder="400"
          />
        </div>


        {/* Category */}
        <div>
          <label className="text-sm text-gray-300">
            Category
          </label>

          <select
            name="category"
            value={form.category}
            onChange={handleChange}
            className="input mt-1"
          >
            <option value="inside">Inside City</option>
            <option value="outside">Outside City</option>
          </select>
        </div>


        {/* Description */}
        <div>
          <label className="text-sm text-gray-300">
            Description
          </label>

          <textarea
            name="description"
            value={form.description}
            onChange={handleChange}
            rows={3}
            className="input mt-1 resize-none"
            placeholder="Short service details..."
          />
        </div>


        {/* Buttons */}
            
           <div
            className="
              flex
              flex-row
              gap-3
              pt-4
              w-full
              justify-center
            "
          >

            <Button
              disabled={saving}
              onClick={submit}
              className="btn-primary w-1/2"
            >
              {saving ? "Updating..." : "Update Service"}
            </Button>


            <Button
              type="button"
              variant="outline"
              className="
                w-1/2
                border-gray-400
                text-gray-300
                hover:bg-gray-500/10
              "
              onClick={() => router.push("/admin/services")}
            >
              Cancel
            </Button>

          </div>


      </div>

    </div>
  );
}
