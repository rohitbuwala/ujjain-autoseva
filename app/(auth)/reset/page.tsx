"use client";

import { useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

export default function ResetPage() {
  const params = useSearchParams();
  const router = useRouter();

  const token = params.get("token");

  const [password, setPassword] = useState("");

  async function handleReset() {
    await fetch("/api/auth/reset", {
      method: "POST",
      body: JSON.stringify({
        token,
        password,
      }),
    });

    alert("Password Reset Success");
    router.push("/login");
  }

  return (
    <div className="min-h-screen flex items-center justify-center">

      <Card className="w-[350px]">
        <CardHeader>Reset Password</CardHeader>

        <CardContent className="space-y-4">

          <Input
            type="password"
            placeholder="New Password"
            onChange={(e) => setPassword(e.target.value)}
          />

          <Button onClick={handleReset} className="w-full">
            Reset
          </Button>

        </CardContent>
      </Card>

    </div>
  );
}
