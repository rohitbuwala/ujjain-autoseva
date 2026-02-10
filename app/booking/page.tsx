"use client";

import { useState } from "react";
import { bookingSchema } from "@/lib/validators/booking";
import { z } from "zod";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2 } from "lucide-react";

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
    const singleField = bookingSchema.pick({ [name]: true } as any);
    const result = singleField.safeParse({ [name]: value });

    if (!result.success) {
      setErrors((prev: any) => ({ ...prev, [name]: result.error.issues[0].message }));
    } else {
      setErrors((prev: any) => ({ ...prev, [name]: "" }));
    }
  }


  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    validateField(name, value);
  }


  /* ========================
     SUBMIT
  ========================= */

  async function handleSubmit(e: React.FormEvent) {
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
        alert("Booking Failed. Please try again.");
        setLoading(false);
        return;
      }

      router.push("/dashboard");

    } catch (err) {
      console.error(err);
      alert("Server Error. Please try again.");
    }

    setLoading(false);
  }


  return (
    <div className="min-h-screen py-16 md:py-24 px-4 bg-muted/30 flex items-center justify-center">

      <Card className="w-full max-w-2xl shadow-lg border-border">

        <CardHeader className="text-center">
          <CardTitle className="text-3xl font-bold">Book Your Ride</CardTitle>
          <CardDescription>
            Fill in the details below to confirm your taxi booking.
          </CardDescription>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

              <FormInput
                label="Full Name"
                name="name"
                placeholder="John Doe"
                value={form.name}
                onChange={handleChange}
                error={errors.name}
              />

              <FormInput
                label="Mobile Number"
                name="phone"
                placeholder="9876543210"
                value={form.phone}
                onChange={handleChange}
                error={errors.phone}
              />

              <FormInput
                label="Alternate Number (Optional)"
                name="altPhone"
                placeholder="Secondary mobile"
                value={form.altPhone}
                onChange={handleChange}
                error={errors.altPhone}
              />

              <FormInput
                label="Price (₹)"
                name="price"
                placeholder="Agreed Amount"
                value={form.price}
                onChange={handleChange}
                error={errors.price}
              />

            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormInput
                label="Pickup Location"
                name="pickup"
                placeholder="Enter pickup point"
                value={form.pickup}
                onChange={handleChange}
                error={errors.pickup}
              />

              <FormInput
                label="Drop Location"
                name="drop"
                placeholder="Enter drop location"
                value={form.drop}
                onChange={handleChange}
                error={errors.drop}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormInput
                label="Date"
                name="date"
                type="date"
                value={form.date}
                onChange={handleChange}
                error={errors.date}
              />

              <FormInput
                label="Time"
                name="time"
                type="time"
                value={form.time}
                onChange={handleChange}
                error={errors.time}
              />
            </div>

            <Button
              type="submit"
              className="w-full text-lg h-12"
              disabled={loading}
            >
              {loading && <Loader2 className="mr-2 h-5 w-5 animate-spin" />}
              {loading ? "Confirming..." : "Confirm Booking"}
            </Button>

          </form>
        </CardContent>
      </Card>

    </div>
  );
}


function FormInput({ label, name, type = "text", value, onChange, placeholder, error }: any) {
  return (
    <div className="space-y-2">
      <Label htmlFor={name} className={error ? "text-red-500" : ""}>{label}</Label>
      <Input
        id={name}
        name={name}
        type={type}
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        className={error ? "border-red-500 focus-visible:ring-red-500" : ""}
      />
      {error && <p className="text-xs text-red-500 font-medium">{error}</p>}
    </div>
  );
}


