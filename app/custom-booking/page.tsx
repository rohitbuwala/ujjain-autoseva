"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CalendarIcon, Clock } from "lucide-react";

interface Temple {
  _id: string;
  name: string;
  price: number;
}

export default function CustomBookingPage() {

  const router = useRouter();

  const [temples, setTemples] = useState<Temple[]>([]);
  const [selectedTemples, setSelectedTemples] = useState<Temple[]>([]);
  const [totalPrice, setTotalPrice] = useState(0);

  const [form, setForm] = useState({
    name: "",
    phone: "",
    altPhone: "",
    date: "",
    time: ""
  });

  const [loading, setLoading] = useState(false);

  /* =============================
      FETCH TEMPLES
  ============================== */

  useEffect(() => {
    async function fetchTemples() {
      const res = await fetch("/api/temples");
      const data = await res.json();
      setTemples(data);
    }
    fetchTemples();
  }, []);

  /* =============================
      TEMPLE SELECT
  ============================== */

  const handleTempleSelect = (temple: Temple) => {

    const exists = selectedTemples.find(t => t._id === temple._id);

    let updated;

    if (exists) {
      updated = selectedTemples.filter(t => t._id !== temple._id);
    } else {
      updated = [...selectedTemples, temple];
    }

    setSelectedTemples(updated);

    const price = updated.reduce((sum, t) => sum + t.price, 0);
    setTotalPrice(price);
  };

  /* =============================
      DATE + TIME VALIDATION
  ============================== */

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {

    const { name, value } = e.target;

    const now = new Date();

    const yyyy = now.getFullYear();
    const mm = String(now.getMonth() + 1).padStart(2, "0");
    const dd = String(now.getDate()).padStart(2, "0");

    const today = `${yyyy}-${mm}-${dd}`;

    const hh = String(now.getHours()).padStart(2, "0");
    const min = String(now.getMinutes()).padStart(2, "0");

    const currentTime = `${hh}:${min}`;

    // ✅ DATE BLOCK
    if (name === "date") {

      if (value < today) {
        alert("Past date not allowed");
        return;
      }

      if (value === today) {
        setForm(prev => ({ ...prev, date: value, time: "" }));
        return;
      }
    }

    // ✅ TIME BLOCK
    if (name === "time") {

      if (form.date === today && value < currentTime) {
        alert("Past time not allowed");
        return;
      }
    }

    setForm(prev => ({ ...prev, [name]: value }));
  }

  /* =============================
      SUBMIT
  ============================== */

  async function handleSubmit(e: React.FormEvent) {

    e.preventDefault();

    if (!selectedTemples.length) {
      alert("Select at least one temple");
      return;
    }

    const selectedDateTime = new Date(`${form.date}T${form.time}`);
    const now = new Date();

    if (selectedDateTime < now) {
      alert("Past date/time not allowed");
      return;
    }

    setLoading(true);

    try {

      const res = await fetch("/api/custom-booking", {
        method: "POST",
        headers: { "Content-Type": "application/json" },

        body: JSON.stringify({
            name: form.name,
            phone: form.phone,
            altPhone: form.altPhone || "",

            temples: selectedTemples.map(t => ({
              _id: t._id,
              name: t.name,
              price: t.price,
            })),

            date: form.date,
            time: form.time,

            price: String(totalPrice),
          }),
      });

      if (!res.ok) throw new Error();

      router.push("/dashboard/booking");

    } catch {
      alert("Booking failed");
    }

    setLoading(false);
  }

  return (

    <div className="min-h-screen py-10 px-4 flex justify-center bg-muted/30">

      <Card className="w-full max-w-3xl shadow-2xl border-border">

        <CardHeader>
          <CardTitle className="text-3xl text-center font-bold">
            Custom Temple Trip
          </CardTitle>
        </CardHeader>

        <CardContent>

          <form onSubmit={handleSubmit} className="space-y-8">

            {/* ================= TEMPLE SELECT ================= */}

            <div>

              <Label className="mb-3 block font-semibold">
                Select Temples
              </Label>

              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">

                {temples.map((t) => {

                  const active = selectedTemples.find(st => st._id === t._id);

                  return (

                    <button
                      key={t._id}
                      type="button"
                      onClick={() => handleTempleSelect(t)}
                      className={`p-3 rounded-xl border text-sm font-medium transition-all duration-200
                      ${active
                        ? "bg-primary text-white border-primary shadow-lg scale-[1.03]"
                        : "bg-background hover:bg-muted hover:scale-[1.02]"
                      }`}
                    >
                      {t.name}
                    </button>

                  );

                })}

              </div>

              {totalPrice > 0 && (
                <div className="mt-4 flex items-center justify-between bg-primary/10 border border-primary/20 rounded-xl px-4 py-3">
                  <p className="font-medium">Total Fare</p>
                  <p className="text-xl font-bold text-primary">₹{totalPrice}</p>
                </div>
              )}

            </div>

            {/* ================= PASSENGER ================= */}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

              <div>
                <Label>Full Name</Label>
                <Input name="name" onChange={handleChange} required />
              </div>

              <div>
                <Label>Mobile Number</Label>
                <Input name="phone" onChange={handleChange} required />
              </div>

              <div>
                <Label>Alternate Number</Label>
                <Input name="altPhone" onChange={handleChange} />
              </div>

            </div>

            {/* ================= DATE TIME ================= */}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

              <div>
                <Label className="flex items-center gap-2">
                  <CalendarIcon size={16} /> Date
                </Label>

                <Input
                  type="date"
                  name="date"
                  onChange={handleChange}
                  required
                />
              </div>

              <div>
                <Label className="flex items-center gap-2">
                  <Clock size={16} /> Time
                </Label>

                <Input
                  type="time"
                  name="time"
                  onChange={handleChange}
                  required
                />
              </div>

            </div>

            <Button className="w-full text-lg h-12">
              {loading ? "Booking..." : "Confirm Booking"}
            </Button>

          </form>

        </CardContent>

      </Card>

    </div>
  );
}