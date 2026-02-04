"use client";

import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

export default function ForgotPage() {
  const [email, setEmail] = useState("");

  async function handleForgot() {
    await fetch("/api/auth/forgot", {
      method: "POST",
      body: JSON.stringify({ email }),
    });

    alert("Reset link sent (check email)");
  }

  return (
    <div className="min-h-screen flex items-center justify-center">

      <Card className="w-[350px]">
        <CardHeader>Forgot Password</CardHeader>

        <CardContent className="space-y-4">

          <Input
            placeholder="Email"
            onChange={(e) => setEmail(e.target.value)}
          />

          <Button onClick={handleForgot} className="w-full">
            Send Link
          </Button>

        </CardContent>
      </Card>

    </div>
  );
}
