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
        alert("Booking Failed ❌");
        return;
      }

      alert("✅ Booking Submitted!");
      router.push("/dashboard");

    } catch (err) {
      alert("Server Error ❌");
    }

    setLoading(false);
  }


  return (
    <div
      className="
        min-h-screen
        flex items-center justify-center

        px-3 sm:px-4 md:px-6
        pt-24 pb-10

        bg-black
        overflow-x-hidden
      "
    >

      {/* FORM CARD */}
      <form
        onSubmit={handleSubmit}
        className="
          card-safe

          w-full
          max-w-lg lg:max-w-2xl

          p-4 sm:p-6 md:p-8

          rounded-xl

          space-y-5

          text-white
        "
      >

        {/* Heading */}
        <h1
          className="
            text-xl sm:text-2xl md:text-3xl
            font-bold text-center
            gradient-text
            mb-2
          "
        >
           Book Your Ride
        </h1>


        {/* FORM GRID */}
        <div
          className="
            grid
            grid-cols-1
            md:grid-cols-2

            gap-4
          "
        >

          <Field
            label="Full Name"
            name="name"
             placeholder="Enter your full name"
            value={form.name}
            error={errors.name}
            onChange={handleChange}
          />

          <Field
            label="Mobile Number"
            name="phone"
            placeholder="Enter mobile number"
            value={form.phone}
            error={errors.phone}
            onChange={handleChange}
          />

          <Field
            label="Alternate Number"
            name="altPhone"
            placeholder="Optional"
            value={form.altPhone}
            error={errors.altPhone}
            onChange={handleChange}
          />

          <Field
            label="Pickup Location"
            name="pickup"
            placeholder="Enter pickup point"
            value={form.pickup}
            error={errors.pickup}
            onChange={handleChange}
          />

          <Field
            label="Drop Location"
            name="drop"
            placeholder="Enter drop location"
            value={form.drop}
            error={errors.drop}
            onChange={handleChange}
          />

          {/* DATE */}
          <Field
            label="Journey Date"
            type="date"
            name="date"
             placeholder="Select date"
            value={form.date}
            error={errors.date}
            onChange={handleChange}
          />

          {/* TIME */}
          <Field
            label="Journey Time"
            type="time"
            name="time" 
            placeholder="Select time"
            value={form.time}
            error={errors.time}
            onChange={handleChange}
          />

          <Field
            label="Price (₹)"
            name="price"
            placeholder="Enter amount"
            value={form.price}
            error={errors.price}
            onChange={handleChange}

          />

        </div>


        {/* SUBMIT */}
        <button
          disabled={loading}
          className="
            btn-primary

            w-full
            py-3

            text-sm sm:text-base
            font-semibold

            disabled:opacity-60
            disabled:cursor-not-allowed
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
   placeholder = "",
}: any) {

  const isDateOrTime = type === "date" || type === "time";

  return (
    <div className="space-y-1 w-full">

      <label className="text-sm text-gray-300">
        {label}
      </label>

      <input
        type={type}
        name={name}
        value={value}
        onChange={onChange}
       placeholder={placeholder}

        /* 🔥 IMPORTANT FIX */
        inputMode={isDateOrTime ? "none" : "text"}

        className={`
          w-full

          px-3 sm:px-4
          py-2.5

          rounded-lg

          border
          bg-black/70
          text-white

          text-sm sm:text-base

          focus:outline-none
          focus:ring-2

          cursor-pointer

          appearance-none
          [-webkit-appearance:none]

          ${
            error
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


