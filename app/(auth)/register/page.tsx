"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardHeader,
} from "@/components/ui/card";

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
    <div className="min-h-screen flex items-center justify-center px-4">

      <Card className="card-safe w-full max-w-md">

        {/* Header */}
        <CardHeader className="text-center space-y-2 pb-2">
          <h1 className="text-3xl font-bold gradient-text">
            Ujjain AutoSeva
          </h1>

          <p className="text-gray-400 text-sm">
            Create your account
          </p>
        </CardHeader>

        {/* Form */}
        <CardContent className="space-y-5 p-6">

          <Input
            placeholder="Full Name"
            onChange={(e) => setName(e.target.value)}
          />

          <Input
            placeholder="Email Address"
            onChange={(e) => setEmail(e.target.value)}
          />

          <Input
            type="password"
            placeholder="Password"
            onChange={(e) => setPassword(e.target.value)}
          />

          <Button
            onClick={handleRegister}
            className="w-full bg-gradient-to-r from-indigo-500 to-purple-600 hover:opacity-90"
          >
            Create Account
          </Button>

          {/* Login Link */}
          <p className="text-sm text-center text-gray-400">
            Already have an account?{" "}
            <span
              onClick={() => router.push("/login")}
              className="text-blue-400 cursor-pointer hover:underline"
            >
              Login
            </span>
          </p>

        </CardContent>
      </Card>

    </div>
  );
}
