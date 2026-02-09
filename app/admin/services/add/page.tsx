"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";

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


  function handleChange(e: any) {

    const { name, value } = e.target;

    setForm(prev => ({
      ...prev,
      [name]: value,
    }));
  }


  async function submit() {

    if (!form.route || !form.time || !form.price) {
      alert("Please fill all required fields ❌");
      return;
    }

    setLoading(true);

    try {

      await fetch("/api/services", {
        method: "POST",
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

      alert("Service Added ✅");

      router.push("/admin/services");

    } catch (err) {
      console.error(err);
      alert("Server Error ❌");
    }

    setLoading(false);
  }


  return (
    <div className="
        min-h-screen
        w-full
        flex
        justify-center
        items-start
        pt-24
        px-3
        sm:px-6
        overflow-x-hidden
        text-white
          ">


     <div className="
        w-full
        max-w-xl
        mx-auto
        card-safe
        p-5
        sm:p-8
        space-y-6
        overflow-hidden
      ">



        {/* Heading */}
        <h1 className="text-2xl sm:text-3xl font-bold text-center gradient-text">
          Add New Service
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
            placeholder="Station to Mahakal"
            className="input mt-1"
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
            placeholder="01h 30m"
            className="input mt-1"
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
            placeholder="400"
            className="input mt-1"
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
            Description (Optional)
          </label>

          <textarea
            name="description"
            value={form.description}
            onChange={handleChange}
            placeholder="Short service details..."
            rows={3}
            className="input mt-1 resize-none"
          />
        </div>


        {/* Buttons */}
            <div className="
              grid
              grid-cols-1
              sm:grid-cols-2
              gap-3
              pt-4
              w-full
            ">


            <Button
              disabled={loading}
              onClick={submit}
              className="btn-primary w-full"
            >
              {loading ? "Saving..." : "Save Service"}
            </Button>

            <Button
              type="button"
              variant="outline"
              className="
                w-full
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
