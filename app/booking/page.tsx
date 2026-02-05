"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function BookingPage() {

  const [form, setForm] = useState({
    name: "",
    phone: "",
    from: "",
    to: "",
    date: "",
  });

  async function submit() {

    const res = await fetch("/api/booking", {
      method: "POST",
      body: JSON.stringify(form),
    });

    if (res.ok) {
      alert("Booking Successful ✅");
    }
  }

  return (
    <div className="min-h-screen flex justify-center items-center">

      <div className="card-safe w-[350px] p-6 space-y-4">

        <h2 className="text-xl font-bold text-center gradient-text">
          Book Ride
        </h2>

        <Input placeholder="Name"
          onChange={e=>setForm({...form,name:e.target.value})}/>

        <Input placeholder="Phone"
          onChange={e=>setForm({...form,phone:e.target.value})}/>

        <Input placeholder="From"
          onChange={e=>setForm({...form,from:e.target.value})}/>

        <Input placeholder="To"
          onChange={e=>setForm({...form,to:e.target.value})}/>

        <Input type="date"
          onChange={e=>setForm({...form,date:e.target.value})}/>

        <Button onClick={submit} className="w-full">
          Book Now
        </Button>

      </div>
    </div>
  );
}
