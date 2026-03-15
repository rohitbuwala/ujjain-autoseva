"use client";

import { useState, useEffect } from "react";
import { bookingSchema } from "@/lib/validators/booking";
import { z } from "zod";
import { useRouter } from "next/navigation";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import {
  CalendarIcon,
  Clock,
  Phone,
  User,
  TicketPercent,
  AlertCircle,
} from "lucide-react";

/* ================= TYPES ================= */

type BookingForm = z.infer<typeof bookingSchema>;

interface Route {
  _id?: string;
  id?: string;
  route?: string;
  from?: string;
  to?: string;
  price: number;
  category?: string;
  time?: string;
}

interface Errors {
  [key: string]: string | undefined;
}

/* ================= PAGE ================= */

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

  const [routes, setRoutes] = useState<Route[]>([]);
  const [loadingRoutes, setLoadingRoutes] = useState(true);
  const [selectedRouteId, setSelectedRouteId] = useState<string>("");
  const [errors, setErrors] = useState<Errors>({});
  const [loading, setLoading] = useState(false);

  const [discount, setDiscount] = useState<{
    saved: number;
    original: number;
    percent: number;
  } | null>(null);

  const [minDate, setMinDate] = useState("");
  const [minTime, setMinTime] = useState("");

  /* ================= DATE LIMIT ================= */

  useEffect(() => {
    const now = new Date();

    const yyyy = now.getFullYear();
    const mm = String(now.getMonth() + 1).padStart(2, "0");
    const dd = String(now.getDate()).padStart(2, "0");

    setMinDate(`${yyyy}-${mm}-${dd}`);

    const hh = String(now.getHours()).padStart(2, "0");
    const min = String(now.getMinutes()).padStart(2, "0");

    setMinTime(`${hh}:${min}`);
  }, []);

  /* ================= FETCH ROUTES ================= */

  useEffect(() => {
    async function fetchRoutes() {
      try {
        const res = await fetch("/api/services");
        const json = await res.json();

        if (json.success && Array.isArray(json.data)) {
          setRoutes(json.data);
        } else if (Array.isArray(json)) {
          setRoutes(json);
        }
      } catch (error) {
        console.error("Failed to fetch routes", error);
      } finally {
        setLoadingRoutes(false);
      }
    }

    fetchRoutes();
  }, []);

  /* ================= ROUTE SELECT ================= */

  const handleRouteChange = (routeId: string) => {
    setSelectedRouteId(routeId);

    const route = routes.find((r) => (r._id || r.id) === routeId);

    if (!route) return;

    setForm((prev) => ({
      ...prev,
      pickup: route.from || "Ujjain",
      drop: route.to || route.route || "",
      price: String(route.price),
    }));

    const price = Number(route.price);
    let markup = 1.3;

    if (route.category === "outside") markup = 1.25;

    const original = Math.round(price * markup);
    const saved = original - price;
    const percent = Math.round((saved / original) * 100);

    if (saved > 0) {
      setDiscount({ saved, original, percent });
    } else {
      setDiscount(null);
    }

    setErrors((prev) => ({ ...prev, pickup: "", drop: "", price: "" }));
  };

  /* ================= LIVE VALIDATION ================= */

  function validateField(name: string, value: string) {
    const singleField = bookingSchema.pick({
      [name]: true,
    } as Partial<Record<keyof BookingForm, true>>);

    const result = singleField.safeParse({ [name]: value });

    if (!result.success) {
      setErrors((prev) => ({
        ...prev,
        [name]: result.error.issues[0].message,
      }));
    } else {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }
  }

  /* ================= CHANGE ================= */

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const { name, value } = e.target;

    if (name === "phone" || name === "altPhone") {
      if (value.length > 10) return;
    }

    setForm((prev) => ({ ...prev, [name]: value }));
    validateField(name, value);
  }

  /* ================= SUBMIT ================= */

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);

    const parsed = bookingSchema.safeParse(form);

    const now = new Date();
    const selectedDateTime = new Date(`${form.date}T${form.time}`);

    if (selectedDateTime < now) {
      alert("You cannot book for past time.");
      setLoading(false);
      return;
    }

    if (!parsed.success) {
      const newErrors: Errors = {};
      parsed.error.issues.forEach((err) => {
        const key = err.path[0] as string;
        newErrors[key] = err.message;
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
        setLoading(false);
        return;
      }

      router.push("/dashboard/booking");
    } catch {
      alert("Server Error");
    }

    setLoading(false);
  }

  /* ================= UI ================= */

  return (
    <div className="min-h-screen py-10 md:py-14 px-4 md:px-0 pb-24 md:pb-0 flex items-start sm:items-center justify-center bg-gradient-to-b from-background via-background to-muted/30">

      <Card className="w-full max-w-2xl shadow-xl border border-border/50 bg-card/80 backdrop-blur rounded-2xl overflow-hidden">

        <div className="bg-gradient-to-r from-primary to-blue-600 h-2 w-full" />

        <CardHeader className="pb-8 border-b border-border/40 mb-6 bg-muted/20 backdrop-blur text-center">
          <CardTitle className="text-3xl sm:text-4xl font-bold tracking-tight">
            Book a Ride 
          </CardTitle>
          <CardDescription className="text-base sm:text-lg mt-2">
            Select a service and book instantly.
          </CardDescription>
        </CardHeader>

        <CardContent className="px-6 sm:px-10 pb-10">

          <form onSubmit={handleSubmit} className="space-y-8">

            {/* ROUTE */}
            <div className="space-y-3 relative z-30">
              <Label className="text-base font-semibold">
                Select Service / Route
              </Label>

              {loadingRoutes ? (
                <div className="h-14 w-full bg-muted animate-pulse rounded-md border" />
              ) : (
                <Select
                  onValueChange={handleRouteChange}
                  value={selectedRouteId}
                >
                  <SelectTrigger className="h-14 text-base bg-background/70 shadow-sm border hover:border-primary transition rounded-lg">
                    <SelectValue placeholder="Choose a route..." />
                  </SelectTrigger>

                  <SelectContent className="max-h-[300px]">
                    {routes.map((route) => {
                      const label =
                        route.route || `${route.from} to ${route.to}`;

                      return (
                        <SelectItem
                          key={route._id || route.id}
                          value={route._id || route.id || ""}
                        >
                          {label} — ₹{route.price}
                        </SelectItem>
                      );
                    })}
                  </SelectContent>
                </Select>
              )}
            </div>

            {/* PRICE */}
            {selectedRouteId && discount && (
              <div className="bg-primary/5 border border-primary/20 rounded-xl p-6 shadow-sm backdrop-blur flex justify-between">

                <div>
                  <p className="text-sm text-muted-foreground">Total Fare</p>
                  <h3 className="text-3xl font-bold text-primary">
                    ₹{form.price}
                  </h3>
                </div>

                <div className="text-right">
                  <p className="text-sm text-muted-foreground">You Save</p>
                  <p className="text-green-600 font-bold">
                    ₹{discount.saved}
                  </p>
                </div>

              </div>
            )}

            {/* PERSONAL */}
            <div className="grid md:grid-cols-2 gap-6">

              <FormInput
                label="Full Name"
                name="name"
                icon={<User size={16} />}
                value={form.name}
                onChange={handleChange}
                error={errors.name}
              />

              <FormInput
                label="Mobile Number"
                name="phone"
                icon={<Phone size={16} />}
                value={form.phone}
                onChange={handleChange}
                error={errors.phone}
              />

            </div>

            {/* DATE TIME */}
            <div className="grid md:grid-cols-2 gap-6">

              <FormInput
                label="Date"
                name="date"
                type="date"
                icon={<CalendarIcon size={16} />}
                min={minDate}
                value={form.date}
                onChange={handleChange}
                error={errors.date}
              />

              <FormInput
                label="Time"
                name="time"
                type="time"
                icon={<Clock size={16} />}
                min={form.date === minDate ? minTime : undefined}
                value={form.time}
                onChange={handleChange}
                error={errors.time}
              />

            </div>

            <Button
              type="submit"
              className="w-full text-lg h-14 bg-primary hover:bg-primary/90 shadow-lg transition-all font-bold rounded-xl hover:scale-[1.01]"
              disabled={loading || !selectedRouteId}
            >
              {loading ? "Processing..." : "Confirm Booking"}
            </Button>

            {!selectedRouteId && (
              <div className="flex items-center justify-center gap-2 text-muted-foreground mt-4 text-sm bg-muted/50 p-2 rounded-lg">
                <AlertCircle size={16} />
                Select route above first.
              </div>
            )}

          </form>
        </CardContent>
      </Card>
    </div>
  );
}

/* ================= INPUT ================= */

interface FormInputProps {
  label: string;
  name: string;
  type?: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  error?: string;
  icon?: React.ReactNode;
  [key: string]: unknown;
}

function FormInput({
  label,
  name,
  type = "text",
  value,
  onChange,
  error,
  icon,
  ...props
}: FormInputProps) {
  return (
    <div className="space-y-2 group">
      <Label className="flex items-center gap-2 font-medium">
        {icon} {label}
      </Label>

      <Input
        name={name}
        type={type}
        value={value}
        onChange={onChange}
        {...props}
        className={`h-12 bg-background/60 transition-all shadow-sm ${
          error
            ? "border-destructive"
            : "hover:border-primary focus-visible:ring-primary"
        }`}
      />

      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}