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
import { Loader2, CalendarIcon, Clock, MapPin, Phone, User, TicketPercent, AlertCircle } from "lucide-react";

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

  const [routes, setRoutes] = useState<any[]>([]);
  const [loadingRoutes, setLoadingRoutes] = useState(true);
  const [selectedRouteId, setSelectedRouteId] = useState<string>("");
  const [errors, setErrors] = useState<any>({});
  const [loading, setLoading] = useState(false);
  const [discount, setDiscount] = useState<{ saved: number, original: number, percent: number } | null>(null);
  const [minDate, setMinDate] = useState("");
  const [minTime, setMinTime] = useState("");

  // Update min date and time
  useEffect(() => {
    const now = new Date();
    // Use local time for Ujjain (assuming server/client local is fine or use UTC offset if needed)
    // For now, simple local date
    const yyyy = now.getFullYear();
    const mm = String(now.getMonth() + 1).padStart(2, "0");
    const dd = String(now.getDate()).padStart(2, "0");
    const dateStr = `${yyyy}-${mm}-${dd}`;
    setMinDate(dateStr);

    const hh = String(now.getHours()).padStart(2, "0");
    const min = String(now.getMinutes()).padStart(2, "0");
    setMinTime(`${hh}:${min}`);
  }, []);

  // Fetch Routes from DB
  useEffect(() => {
    async function fetchRoutes() {
      try {
        const res = await fetch("/api/services");
        const data = await res.json();
        if (Array.isArray(data)) {
          setRoutes(data);
        }
      } catch (error) {
        console.error("Failed to fetch routes", error);
      } finally {
        setLoadingRoutes(false);
      }
    }
    fetchRoutes();
  }, []);


  // Handle Route Selection
  const handleRouteChange = (routeId: string) => {
    setSelectedRouteId(routeId);
    const route = routes.find(r => (r._id || r.id) === routeId);

    if (route) {
      setForm(prev => ({
        ...prev,
        pickup: route.from || "Ujjain", // Fallback if missing
        drop: route.to || route.route, // Use 'to' or route name
        price: String(route.price)
      }));

      // Calculate Discount (Same logic as Service Page)
      const price = Number(route.price);
      // Dynamic markup logic based on category/price to match service page
      let markup = 1.3; // Default 30%
      if (route.category === "outside") markup = 1.25; // 25% for outside

      const original = Math.round(price * markup);
      const saved = original - price;
      const percent = Math.round((saved / original) * 100);

      if (saved > 0) {
        setDiscount({ saved, original, percent });
      } else {
        setDiscount(null);
      }

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

    // Date & Time Validation
    if (name === "date") {
      const now = new Date();
      const yyyy = now.getFullYear();
      const mm = String(now.getMonth() + 1).padStart(2, "0");
      const dd = String(now.getDate()).padStart(2, "0");
      const todayStr = `${yyyy}-${mm}-${dd}`;

      if (value < todayStr) {
        setErrors((prev: any) => ({ ...prev, date: "Please select a future date." }));
        return;
      }

      // If today is selected, and previous time choice is now past, clear it
      if (value === todayStr && form.time) {
        const hh = String(now.getHours()).padStart(2, "0");
        const minutes = String(now.getMinutes()).padStart(2, "0");
        const currentTime = `${hh}:${minutes}`;
        if (form.time < currentTime) {
          setForm(prev => ({ ...prev, time: "" }));
          setErrors((prev: any) => ({ ...prev, time: "Please select a future time for today." }));
        }
      }
    }

    if (name === "time") {
      const currentDate = new Date();
      const yyyy = currentDate.getFullYear();
      const mm = String(currentDate.getMonth() + 1).padStart(2, "0");
      const dd = String(currentDate.getDate()).padStart(2, "0");
      const todayStr = `${yyyy}-${mm}-${dd}`;

      if (form.date === todayStr) {
        const hh = String(currentDate.getHours()).padStart(2, "0");
        const minutes = String(currentDate.getMinutes()).padStart(2, "0");
        const currentTime = `${hh}:${minutes}`;
        if (value < currentTime) {
          setErrors((prev: any) => ({ ...prev, time: "Please select a future time." }));
          return;
        }
      }
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
    const now = new Date();
    const selectedDateTime = new Date(`${form.date}T${form.time}`);

    if (selectedDateTime < now) {
      alert("You cannot book for a past date or time. Current time: " + now.toLocaleTimeString());
      setLoading(false);
      return;
    }

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

      router.push("/dashboard/booking");

    } catch (err) {  
      console.error(err);
      alert("Server Error. Please try again.");
    }

    setLoading(false);
  }


  return (
    <div className="min-h-screen py-8 md:py-12 px-4 flex items-start sm:items-center justify-center bg-muted/20">

      <Card className="w-full max-w-2xl shadow-2xl border-border/60 bg-card overflow-hidden">

        <div className="bg-gradient-to-r from-primary to-blue-600 h-2 w-full" />

        <CardHeader className="pb-8 border-b border-border/40 mb-6 bg-accent/10">
          <CardTitle className="text-3xl sm:text-4xl font-bold tracking-tight text-foreground text-center">
            Book a Ride
          </CardTitle>
          <CardDescription className="text-base sm:text-lg text-muted-foreground mt-2 text-center">
            Select a service and book instantly.
          </CardDescription>
        </CardHeader>

        <CardContent className="px-6 sm:px-10 pb-10">
          <form onSubmit={handleSubmit} className="space-y-8">

            {/* Route Selection */}
            <div className="space-y-3 relative z-30">
              <Label className="text-base font-semibold text-foreground">Select Service / Route</Label>

              {loadingRoutes ? (
                <div className="h-14 w-full bg-muted animate-pulse rounded-md border border-input" />
              ) : (
                <Select onValueChange={handleRouteChange} value={selectedRouteId}>
                  <SelectTrigger className="h-14 text-base bg-background shadow-sm border-input hover:border-primary/50 transition-colors">
                    <SelectValue placeholder="Choose a route..." />
                  </SelectTrigger>
                  <SelectContent
                    className="max-h-[300px] z-[100] bg-popover text-popover-foreground border-border shadow-2xl overflow-hidden"
                    position="popper"
                    sideOffset={5}
                  >
                    {routes.length === 0 ? (
                      <div className="p-4 text-center text-muted-foreground text-sm">
                        No routes available. Please contact support.
                      </div>
                    ) : (
                      routes.map((route) => {
                        const price = Number(route.price);
                        let markup = 1.3;
                        if (route.category === "outside") markup = 1.25;
                        const original = Math.round(price * markup);
                        const off = Math.round(((original - price) / original) * 100);

                        const label = route.route || `${route.from} to ${route.to}`;

                        return (
                          <SelectItem key={route._id || route.id} value={route._id || route.id} className="cursor-pointer py-3 px-4 focus:bg-accent focus:text-accent-foreground border-b border-border/30 last:border-0">
                            <div className="flex flex-col gap-1 items-start text-left w-full">
                              <span className="font-semibold text-foreground text-base pr-8">{label}</span>
                              <div className="flex justify-between w-full items-center mt-1">
                                <span className="text-xs text-muted-foreground flex gap-2 items-center">
                                  <span className="line-through opacity-70">₹{original}</span>
                                  <span className="font-bold text-primary">₹{price}</span>
                                </span>
                                {off > 0 && (
                                  <span className="text-[10px] font-bold text-green-600 bg-green-100 dark:bg-green-900/40 px-2 py-0.5 rounded-full">
                                    {off}% OFF
                                  </span>
                                )}
                              </div>
                            </div>
                          </SelectItem>
                        );
                      })
                    )}
                  </SelectContent>
                </Select>
              )}
            </div>

            {/* Price Summary Panel */}
            {selectedRouteId && (
              <div className="bg-primary/5 border border-primary/20 rounded-xl p-6 flex flex-col sm:flex-row justify-between items-center gap-4 animate-in fade-in slide-in-from-top-4 duration-500">
                <div className="text-center sm:text-left">
                  <p className="text-sm text-muted-foreground font-medium mb-1">Total Fare</p>
                  <div className="flex items-baseline gap-2 justify-center sm:justify-start">
                    <h3 className="text-3xl font-bold text-primary">₹{form.price}</h3>
                    {discount && <span className="text-lg text-muted-foreground line-through decoration-destructive/50">₹{discount.original}</span>}
                  </div>
                </div>
                {discount && (
                  <div className="bg-white dark:bg-slate-900 shadow-sm border border-border/50 rounded-lg px-4 py-2 flex items-center gap-2">
                    <TicketPercent className="h-5 w-5 text-green-500" />
                    <div>
                      <p className="text-xs text-muted-foreground font-semibold uppercase">You Save</p>
                      <p className="text-green-600 font-bold">₹{discount.saved} ({discount.percent}%)</p>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Personal Details */}
            <div className="space-y-4 pt-4">
              <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider border-b pb-2">Passenger Details</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormInput
                  label="Full Name"
                  name="name"
                  placeholder="Ex. Rahul Sharma"
                  icon={<User size={16} />}
                  value={form.name}
                  onChange={handleChange}
                  error={errors.name}
                />

                <FormInput
                  label="Mobile Number"
                  name="phone"
                  placeholder="10-digit number"
                  type="number"
                  icon={<Phone size={16} />}
                  value={form.phone}
                  onChange={handleChange}
                  error={errors.phone}
                  maxLength={10}
                />
                <FormInput
                  label="Alternate Number"
                  name="altPhone"
                  placeholder="Optional"
                  type="number"
                  icon={<Phone size={16} />}
                  value={form.altPhone}
                  onChange={handleChange}
                  error={errors.altPhone}
                  maxLength={10}
                />
              </div>
            </div>

            {/* Schedule */}
            <div className="space-y-4 pt-2">
              <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider border-b pb-2">Schedule Ride</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormInput
                  label="Date"
                  name="date"
                  type="date"
                  min={minDate}
                  icon={<CalendarIcon size={16} />}
                  value={form.date}
                  onChange={handleChange}
                  error={errors.date}
                />

                <FormInput
                  label="Time"
                  name="time"
                  type="time"
                  min={form.date === minDate ? minTime : undefined}
                  icon={<Clock size={16} />}
                  value={form.time}
                  onChange={handleChange}
                  error={errors.time}
                />
              </div>
            </div>

            <Button
              type="submit"
              className="w-full text-lg h-14 mt-8 bg-primary hover:bg-primary/90 shadow-lg shadow-primary/20 transition-all font-bold rounded-xl active:scale-[0.99]"
              disabled={loading || !selectedRouteId}
            >
              {loading ? (
                <div className="flex items-center justify-center gap-2">
                  <span className="relative flex h-3 w-3">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-3 w-3 bg-white"></span>
                  </span>
                  Processing...
                </div>
              ) : (
                "Confirm Booking"
              )}
            </Button>

            {!selectedRouteId && (
              <div className="flex items-center justify-center gap-2 text-muted-foreground mt-4 text-sm bg-muted/50 p-2 rounded-lg">
                <AlertCircle size={16} />
                <p>Select a route above to see pricing and book.</p>
              </div>
            )}

          </form>
        </CardContent>
      </Card>

    </div>
  );
}


function FormInput({ label, name, type = "text", value, onChange, placeholder, error, toggleParams, icon, maxLength, ...props }: any) {
  return (
    <div className="space-y-2 group">
      <Label htmlFor={name} className={`flex items-center gap-2 font-medium transition-colors ${error ? "text-destructive" : "text-muted-foreground group-focus-within:text-primary"}`}>
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
        {...props}
        className={`h-12 border-input bg-background/50 focus:bg-background transition-all shadow-sm ${error ? "border-destructive focus-visible:ring-destructive" : "hover:border-primary/40 focus-visible:ring-primary"}`}
      />
      {error && <p className="text-xs text-destructive font-medium animate-in slide-in-from-top-1">{error}</p>}
    </div>
  );
}
