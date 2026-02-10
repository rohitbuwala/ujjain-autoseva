"use client";

import { signIn } from "next-auth/react";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

import {
  Card,
  CardContent,
  CardHeader,
} from "@/components/ui/card";


export default function LoginPage() {

  const router = useRouter();
  const { status } = useSession();


  // If already logged in → go home
  useEffect(() => {
    if (status === "authenticated") {
      router.replace("/");
    }
  }, [status]);


  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");


  async function handleLogin() {

    setError("");


    if (!email || !password) {
      setError("Email & Password required ❌");
      return;
    }


    setLoading(true);


    const res = await signIn("credentials", {
      email,
      password,
      redirect: false,
    });


    setLoading(false);


    if (res?.ok) {
      router.replace("/dashboard");
      return;
    }


    // Show error
    if (res?.error) {

      if (res.error.includes("No user")) {
        setError("Email not found ❌");
      }

      else if (res.error.includes("Wrong")) {
        setError("Wrong password ❌");
      }

      else {
        setError("Login failed ❌");
      }

    }

  }


  return (
    <div className="
      min-h-screen
      flex
      items-center
      justify-center
      px-4
      py-10
    ">

      <Card className="card-safe w-full max-w-md">


        {/* Header */}
        <CardHeader className="text-center space-y-2">

          <h1 className="text-3xl font-bold gradient-text">
            Login
          </h1>

          <p className="text-gray-400 text-sm">
            Login to continue
          </p>

        </CardHeader>



        <CardContent className="space-y-5 p-6">


          {/* Error */}
          {error && (
            <div className="
              bg-red-500/20
              text-red-300
              border
              border-red-500/30
              rounded-md
              px-3
              py-2
              text-sm
              text-center
            ">
              {error}
            </div>
          )}


          {/* Email */}
          <Input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />


          {/* Password */}
          <Input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />


          {/* Login */}
          <Button
            disabled={loading}
            onClick={handleLogin}
            className="btn-primary w-full"
          >
            {loading ? "Logging in..." : "Login"}
          </Button>


          {/* Google */}
          <Button
            variant="outline"
            onClick={() => signIn("google")}
            className="w-full"
          >
            Login with Google
          </Button>


          {/* Links */}
          <div className="text-center text-sm space-y-1">

            <p
              onClick={() => router.push("/forgot")}
              className="text-blue-400 cursor-pointer"
            >
              Forgot password?
            </p>

            <p className="text-gray-400">
              New user?{" "}
              <span
                onClick={() => router.push("/register")}
                className="text-green-400 cursor-pointer"
              >
                Register
              </span>
            </p>

          </div>


        </CardContent>

      </Card>

    </div>
  );
}
