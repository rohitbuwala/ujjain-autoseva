"use client";

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


export default function RegisterPage() {

  const router = useRouter();
  const { status } = useSession();


  // Redirect if already logged in
  useEffect(() => {
    if (status === "authenticated") {
      router.push("/");
    }
  }, [status]);


  // Form State
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");


  // Submit
  async function handleRegister() {

    setError("");
    setSuccess("");


    // Basic validation
    if (!name || !email || !password) {
      setError("All fields are required ❌");
      return;
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters ❌");
      return;
    }


    setLoading(true);

    try {

      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name,
          email,
          password,
        }),
      });

      const data = await res.json();


      if (!res.ok) {
        setError(data.error || "Registration failed ❌");
        setLoading(false);
        return;
      }


      // Success
      setSuccess("Account created successfully ✅");

      setTimeout(() => {
        router.push("/login");
      }, 1500);


    } catch (err) {

      console.error(err);
      setError("Server error. Try again ❌");

    } finally {
      setLoading(false);
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
        <CardHeader className="text-center space-y-2 pb-2">

          <h1 className="text-3xl font-bold gradient-text">
            Create Account
          </h1>

          <p className="text-gray-400 text-sm">
            Join Ujjain AutoSeva
          </p>

        </CardHeader>



        {/* Content */}
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


          {/* Success */}
          {success && (
            <div className="
              bg-green-500/20
              text-green-300
              border
              border-green-500/30
              rounded-md
              px-3
              py-2
              text-sm
              text-center
            ">
              {success}
            </div>
          )}


          {/* Name */}
          <Input
            placeholder="Full Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />


          {/* Email */}
          <Input
            type="email"
            placeholder="Email Address"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />


          {/* Password */}
          <Input
            type="password"
            placeholder="Password (min 6 chars)"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />


          {/* Button */}
          <Button
            disabled={loading}
            onClick={handleRegister}
            className="btn-primary w-full"
          >
            {loading ? "Creating account..." : "Register"}
          </Button>



          {/* Login Link */}
          <p className="text-sm text-center text-gray-400">

            Already have an account?{" "}

            <span
              onClick={() => router.push("/login")}
              className="
                text-blue-400
                cursor-pointer
                hover:underline
              "
            >
              Login
            </span>

          </p>


        </CardContent>

      </Card>

    </div>
  );
}
