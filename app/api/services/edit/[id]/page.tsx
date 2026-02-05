"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";

import { Button } from "@/components/ui/button";

export default function EditService() {

  const router = useRouter();
  const params = useParams();

  const [form, setForm] = useState<any>({});

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    const res = await fetch(
      `/api/services/${params.id}`
    );

    const data = await res.json();
    setForm(data);
  };

  const submit = async () => {

    await fetch(`/api/services/${params.id}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(form),
    });

    router.push("/admin/services");
  };

  return (
    <div className="max-w-xl">

      <h1 className="text-2xl mb-5 font-bold">
        Edit Service
      </h1>

      {["from","to","type","distance","time","price"].map((f) => (

        <input
          key={f}
          value={form[f] || ""}
          placeholder={f}
          className="w-full mb-3 p-2 rounded bg-black/30"
          onChange={(e) =>
            setForm({ ...form, [f]: e.target.value })
          }
        />

      ))}

      <Button
        className="btn-neon w-full mt-3"
        onClick={submit}
      >
        Update
      </Button>

    </div>
  );
}
