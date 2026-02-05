"use client";

import { signIn } from "next-auth/react";
import { useState } from "react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardHeader,
} from "@/components/ui/card";

export default function LoginPage() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  async function handleLogin() {
    const res = await signIn("credentials", {
      email,
      password,
      redirect: false,
    });

    if (res?.ok) {
      router.push("/dashboard");
    } else {
      alert("Login Failed");
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4">

      <Card className="card-safe w-full max-w-md">

        {/* Header */}
        <CardHeader className="text-center space-y-2 pb-2">
          <h1 className="text-3xl font-bold gradient-text">
            Welcome Back
          </h1>

          <p className="text-gray-400 text-sm">
            Login to continue
          </p>
        </CardHeader>

        {/* Form */}
        <CardContent className="space-y-5 p-6">

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
            onClick={handleLogin}
            className="w-full bg-gradient-to-r from-indigo-500 to-purple-600 hover:opacity-90"
          >
            Login
          </Button>

          {/* Google Login */}
          <Button
            variant="outline"
            onClick={() => signIn("google")}
            className="w-full border-white/20 hover:bg-white/10"
          >
            Login with Google
          </Button>

          {/* Forgot */}
          <p
            onClick={() => router.push("/forgot")}
            className="text-sm text-blue-400 cursor-pointer text-center hover:underline"
          >
            Forgot Password?
          </p>

          {/* Register Link */}
          <p className="text-sm text-center text-gray-400">
            Don&apos;t have an account?{" "}
            <span
              onClick={() => router.push("/register")}
              className="text-green-400 cursor-pointer hover:underline"
            >
              Register
            </span>
          </p>

        </CardContent>
      </Card>

    </div>
  );
}
