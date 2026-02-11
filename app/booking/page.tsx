"use client";

import { useState, useEffect } from "react";
import { bookingSchema } from "@/lib/validators/booking";
import { z } from "zod";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, CalendarIcon, Clock, MapPin, IndianRupee } from "lucide-react";
import { PREDEFINED_ROUTES } from "@/lib/constants";

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

  const [selectedRouteId, setSelectedRouteId] = useState<string>("");
  const [errors, setErrors] = useState<any>({});
  const [loading, setLoading] = useState(false);


  // Handle Route Selection
  const handleRouteChange = (routeId: string) => {
    setSelectedRouteId(routeId);
    const route = PREDEFINED_ROUTES.find(r => r.id === routeId);

    if (route) {
      setForm(prev => ({
        ...prev,
        pickup: route.pickup,
        drop: route.drop,
        price: route.price
      }));
      // Clear errors for these fields if any
      setErrors((prev: any) => ({ ...prev, pickup: "", drop: "", price: "" }));
    }
  };

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

    // Mobile validation: prevent > 10 digits
    if ((name === "phone" || name === "altPhone") && value.length > 10) {
      return;
    }

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
        const data = await res.json();
        alert(data.error || "Booking Failed. Please try again.");
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
    <div className="min-h-screen py-20 px-4 bg-muted/30 flex items-center justify-center">

      <Card className="w-full max-w-2xl shadow-xl border-border/60 bg-card">

        <CardHeader className="text-center pb-8 border-b border-border/40 mb-6 bg-accent/20 rounded-t-xl">
          <CardTitle className="text-3xl font-bold tracking-tight text-primary">Book Your Ride</CardTitle>
          <CardDescription className="text-base text-muted-foreground mt-2">
            Select your route and schedule your journey in seconds.
          </CardDescription>
        </CardHeader>

        <CardContent className="px-6 sm:px-8">
          <form onSubmit={handleSubmit} className="space-y-8">

            {/* Route Selection */}
            <div className="space-y-4">
              <Label className="text-base font-semibold">Select Route</Label>
              <Select onValueChange={handleRouteChange} value={selectedRouteId}>
                <SelectTrigger className="h-12 text-base bg-background">
                  <SelectValue placeholder="Choose a route..." />
                </SelectTrigger>
                <SelectContent>
                  {PREDEFINED_ROUTES.map((route) => (
                    <SelectItem key={route.id} value={route.id} className="cursor-pointer py-3">
                      <span className="font-medium">{route.label}</span>
                      <span className="ml-2 text-muted-foreground text-sm">- ₹{route.price}</span>
                    </SelectItem>
                  ))}
                  <SelectItem value="custom" className="text-muted-foreground italic" disabled>
                    Custom Route (Contact Admin)
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

              <FormInput
                label="Full Name"
                name="name"
                placeholder="Ex. Rahul Sharma"
                value={form.name}
                onChange={handleChange}
                error={errors.name}
              />

              <FormInput
                label="Mobile Number"
                name="phone"
                placeholder="9876543210"
                type="number"
                value={form.phone}
                onChange={handleChange}
                error={errors.phone}
                maxLength={10}
              />

            </div>

            {/* Auto-Filled Details (Read Only) */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-muted/40 p-4 rounded-lg border border-border/50">

              <div className="md:col-span-2 text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-[-10px]">
                Route Details
              </div>

              <div className="space-y-2">
                <Label className="flex items-center gap-2 text-muted-foreground">
                  <MapPin size={16} /> Pickup Point
                </Label>
                <Input
                  value={form.pickup}
                  readOnly
                  className="bg-muted text-muted-foreground focus-visible:ring-0 border-transparent shadow-none font-medium"
                  placeholder="Auto-filled"
                />
              </div>

              <div className="space-y-2">
                <Label className="flex items-center gap-2 text-muted-foreground">
                  <MapPin size={16} /> Drop Point
                </Label>
                <Input
                  value={form.drop}
                  readOnly
                  className="bg-muted text-muted-foreground focus-visible:ring-0 border-transparent shadow-none font-medium"
                  placeholder="Auto-filled"
                />
              </div>

              <div className="space-y-2 md:col-span-2">
                <Label className="flex items-center gap-2 text-muted-foreground">
                  <IndianRupee size={16} /> Estimated Fare
                </Label>
                <div className="text-2xl font-bold text-primary px-3 py-2">
                  {form.price ? `₹${form.price}` : "₹0"}
                </div>
              </div>

            </div>


            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormInput
                label="Date"
                name="date"
                type="date"
                icon={<CalendarIcon size={16} />}
                value={form.date}
                onChange={handleChange}
                error={errors.date}
              />

              <FormInput
                label="Time"
                name="time"
                type="time"
                icon={<Clock size={16} />}
                value={form.time}
                onChange={handleChange}
                error={errors.time}
              />
            </div>

            <div className="pt-2">
              <FormInput
                label="Alternate Number (Optional)"
                name="altPhone"
                placeholder="Secondary mobile"
                type="number"
                value={form.altPhone}
                onChange={handleChange}
                error={errors.altPhone}
                maxLength={10}
              />
            </div>

            <Button
              type="submit"
              className="w-full text-lg h-14 mt-4 bg-primary hover:bg-primary/90 shadow-lg shadow-primary/20 transition-all font-semibold"
              disabled={loading || !selectedRouteId}
            >
              {loading && <Loader2 className="mr-2 h-5 w-5 animate-spin" />}
              {loading ? "Confirming Booking..." : "Confirm Booking"}
            </Button>

          </form>
        </CardContent>
      </Card>

    </div>
  );
}


function FormInput({ label, name, type = "text", value, onChange, placeholder, error, toggleParams, icon, maxLength }: any) {
  return (
    <div className="space-y-2">
      <Label htmlFor={name} className={`flex items-center gap-2 ${error ? "text-destructive" : ""}`}>
        {icon} {label}
      </Label>
      <Input
        id={name}
        name={name}
        type={type}
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        maxLength={maxLength}
        className={`h-11 ${error ? "border-destructive focus-visible:ring-destructive" : ""}`}
      />
      {error && <p className="text-xs text-destructive font-medium animate-in slide-in-from-top-1">{error}</p>}
    </div>
  );
}


