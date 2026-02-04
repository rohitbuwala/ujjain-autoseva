"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

export default function RegisterPage() {
  const router = useRouter();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  async function handleRegister() {
    const res = await fetch("/api/auth/register", {
      method: "POST",
      body: JSON.stringify({ name, email, password }),
    });

    if (res.ok) {
      router.push("/login");
    } else {
      alert("Register Failed");
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center">

      <Card className="w-[350px]">
        <CardHeader>Register</CardHeader>

        <CardContent className="space-y-4">

          <Input
            placeholder="Name"
            onChange={(e) => setName(e.target.value)}
          />

          <Input
            placeholder="Email"
            onChange={(e) => setEmail(e.target.value)}
          />

          <Input
            type="password"
            placeholder="Password"
            onChange={(e) => setPassword(e.target.value)}
          />

          <Button onClick={handleRegister} className="w-full">
            Register
          </Button>

        </CardContent>
      </Card>

    </div>
  );
}
