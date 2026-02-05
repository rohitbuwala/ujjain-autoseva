"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";

export default function AddService() {

  const [form, setForm] = useState<any>({});

  const submit = async () => {

    await fetch("/api/services", {
      method: "POST",
      body: JSON.stringify(form),
    });

    location.href = "/admin/services";
  };

  return (
    <div className="max-w-xl">

      <h1 className="text-2xl mb-4">Add Service</h1>

      {["from","to","type","distance","time","price"].map((f) => (

        <input
          key={f}
          placeholder={f}
          className="w-full mb-3 p-2 rounded bg-black/30"
          onChange={(e) =>
            setForm({ ...form, [f]: e.target.value })
          }
        />

      ))}

      <Button onClick={submit}>
        Save
      </Button>

    </div>
  );
}
