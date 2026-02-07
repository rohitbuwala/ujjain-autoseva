"use client";

import { useState } from "react";
import { bookingSchema } from "@/lib/validators/booking";
import { z } from "zod";
import { useRouter } from "next/navigation";

type BookingForm = z.infer<typeof bookingSchema>;

export default function BookingPage() {

  const router = useRouter();

  const [form, setForm] = useState<BookingForm>({
    name: "",
    phone: "",
    altPhone: "",
    pickup: "",
    drop: "",
    date: "",
    time: "",
    price: "",
  });

  const [errors, setErrors] = useState<any>({});
  const [loading, setLoading] = useState(false);

  /* ========================
     LIVE VALIDATION
  ========================= */

  function validateField(name: string, value: string) {

    const singleField = bookingSchema.pick({
      [name]: true,
    } as any);

    const result = singleField.safeParse({
      [name]: value,
    });

    if (!result.success) {
      setErrors((prev: any) => ({
        ...prev,
        [name]: result.error.issues[0].message,
      }));
    } else {
      setErrors((prev: any) => ({
        ...prev,
        [name]: "",
      }));
    }
  }

  function handleChange(e: any) {

    const { name, value } = e.target;

    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));

    validateField(name, value);
  }

  /* ========================
     SUBMIT
  ========================= */

  async function handleSubmit(e: any) {
    e.preventDefault();

    setLoading(true);

    const parsed = bookingSchema.safeParse(form);

    if (!parsed.success) {

      const newErrors: any = {};

      parsed.error.issues.forEach((err) => {
        newErrors[err.path[0]] = err.message;
      });

      setErrors(newErrors);
      setLoading(false);
      return;
    }

    try {

      const res = await fetch("/api/booking", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      if (!res.ok) {
        alert("Booking Failed");
        return;
      }

      alert("✅ Booking Submitted!");
      router.push("/dashboard");

    } catch (err) {
      alert("Server Error");
    }

    setLoading(false);
  }

  return (
    <div className="min-h-screen bg-black flex justify-center items-center pt-24">

      <form
        onSubmit={handleSubmit}
        className="w-full max-w-md bg-white/5 p-6 rounded-xl space-y-4 text-white"
      >

        <h1 className="text-2xl font-bold text-center mb-3">
          🚖 Book Your Ride
        </h1>

        <Field
          label="Full Name"
          name="name"
          value={form.name}
          error={errors.name}
          onChange={handleChange}
        />

        <Field
          label="Mobile Number"
          name="phone"
          value={form.phone}
          error={errors.phone}
          onChange={handleChange}
        />

        <Field
          label="Alternate Number"
          name="altPhone"
          value={form.altPhone}
          error={errors.altPhone}
          onChange={handleChange}
        />

        <Field
          label="Pickup Location"
          name="pickup"
          value={form.pickup}
          error={errors.pickup}
          onChange={handleChange}
        />

        <Field
          label="Drop Location"
          name="drop"
          value={form.drop}
          error={errors.drop}
          onChange={handleChange}
        />

        {/* DATE PICKER */}
        <Field
          label="Journey Date"
          type="date"
          name="date"
          value={form.date}
          error={errors.date}
          onChange={handleChange}
        />

        {/* TIME PICKER */}
        <Field
          label="Journey Time"
          type="time"
          name="time"
          value={form.time}
          error={errors.time}
          onChange={handleChange}
        />

        <Field
          label="Price (₹)"
          name="price"
          value={form.price}
          error={errors.price}
          onChange={handleChange}
        />

        <button
          disabled={loading}
          className="
            w-full bg-blue-600 py-2 rounded
            hover:bg-blue-700 transition
          "
        >
          {loading ? "Submitting..." : "Confirm Booking"}
        </button>

      </form>
    </div>
  );
}

/* ========================
   INPUT COMPONENT
======================== */
function Field({
  label,
  name,
  value,
  error,
  onChange,
  type = "text",
}: any) {

  const isDateOrTime = type === "date" || type === "time";

  return (
    <div className="space-y-1">

      <label className="text-sm text-gray-300">
        {label}
      </label>

      <input
        type={type}
        name={name}
        value={value}
        onChange={onChange}

        /* IMPORTANT FIX */
        onFocus={(e) => {
          if (isDateOrTime) {
            (e.target as any).showPicker?.();
          }
        }}

        className={`
          w-full px-3 py-2 rounded
          border bg-black text-white

          focus:outline-none
          focus:ring-2

          ${isDateOrTime ? "cursor-pointer" : ""}

          ${error
            ? "border-red-500 ring-red-500/30"
            : "border-white/20 ring-blue-500/30"
          }
        `}
      />

      {error && (
        <p className="text-xs text-red-400">
          {error}
        </p>
      )}

    </div>
  );
}
