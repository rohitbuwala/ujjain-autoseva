"use client";

import { signIn } from "next-auth/react";
import { useState } from "react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

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
    <div className="min-h-screen flex items-center justify-center">

      <Card className="w-[350px]">
        <CardHeader>Login</CardHeader>

        <CardContent className="space-y-4">

          <Input
            placeholder="Email"
            onChange={(e) => setEmail(e.target.value)}
          />

          <Input
            type="password"
            placeholder="Password"
            onChange={(e) => setPassword(e.target.value)}
          />

          <Button onClick={handleLogin} className="w-full">
            Login
          </Button>

          <Button
            variant="outline"
            onClick={() => signIn("google")}
            className="w-full"
          >
            Login with Google
          </Button>

          <p
            onClick={() => router.push("/forgot")}
            className="text-sm text-blue-600 cursor-pointer text-center"
          >
            Forgot Password?
          </p>

        </CardContent>
      </Card>

    </div>
  );
}
