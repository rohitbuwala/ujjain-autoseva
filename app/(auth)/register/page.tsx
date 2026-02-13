"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";

import { Loader2, Eye, EyeOff } from "lucide-react";
import Link from "next/link";


export default function RegisterPage() {

  const router = useRouter();
  const { status } = useSession();


  /* ================= AUTO REDIRECT ================= */

  useEffect(() => {
    if (status === "authenticated") {
      router.replace("/");
    }
  }, [status]);



  /* ================= STATES ================= */

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");

  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");

  const [showPass, setShowPass] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");



  /* ================= REGISTER ================= */

  async function handleRegister(e?: React.FormEvent) {

    if (e) e.preventDefault();

    setError("");
    setSuccess("");


    /* ================= VALIDATION ================= */

    if (!name.trim() || !email.trim() || !password || !confirm) {
      setError("All fields are required.");
      return;
    }

    if (!/^\S+@\S+\.\S+$/.test(email)) {
      setError("Please enter a valid email.");
      return;
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }

    if (!/[A-Z]/.test(password)) {
      setError("Password must contain 1 uppercase letter.");
      return;
    }

    if (!/[0-9]/.test(password)) {
      setError("Password must contain 1 number.");
      return;
    }

    if (password !== confirm) {
      setError("Passwords do not match.");
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
          name: name.trim(),
          email: email.toLowerCase().trim(),
          password,
        }),
      });


      const data = await res.json();

      setLoading(false);



      /* ================= ERROR ================= */

      if (!res.ok) {

        if (data.error === "EMAIL_EXISTS") {
          setError("Account already exists. Please login.");
          return;
        }

        setError(data.error || "Registration failed.");
        return;
      }



      /* ================= SUCCESS ================= */

      setSuccess("Account created successfully! Redirecting...");

      setTimeout(() => {
        router.push("/login");
      }, 1500);


    } catch (err) {

      console.error(err);

      setLoading(false);

      setError("Network error. Please try again.");

    }

  }



  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12">

      <Card className="w-full max-w-md shadow-xl border-border">


        {/* ================= HEADER ================= */}

        <CardHeader className="space-y-1 text-center">

          <CardTitle className="text-3xl font-bold">
            Create Account
          </CardTitle>

          <CardDescription>
            Join Ujjain AutoSeva today
          </CardDescription>

        </CardHeader>



        {/* ================= BODY ================= */}

        <CardContent className="space-y-4">


          {/* Error */}
          {error && (
            <div className="bg-red-500/15 text-red-500 p-3 rounded-md text-sm text-center border border-red-500/30">
              ⚠️ {error}
            </div>
          )}


          {/* Success */}
          {success && (
            <div className="bg-green-500/15 text-green-500 p-3 rounded-md text-sm text-center border border-green-500/30">
              ✅ {success}
            </div>
          )}



          <form
            className="space-y-4"
            onSubmit={handleRegister}
          >


            {/* Name */}
            <div className="space-y-1">

              <Label>Full Name</Label>

              <Input
                placeholder="Your name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                disabled={loading}
              />

            </div>



            {/* Email */}
            <div className="space-y-1">

              <Label>Email</Label>

              <Input
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={loading}
              />

            </div>



            {/* Password */}
            <div className="space-y-1">

              <Label>Password</Label>

              <div className="relative">

                <Input
                  type={showPass ? "text" : "password"}
                  placeholder="Min 6 chars"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={loading}
                />

                <button
                  type="button"
                  onClick={() => setShowPass(!showPass)}
                  className="absolute right-3 top-2.5 text-muted-foreground"
                >
                  {showPass ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>

              </div>

            </div>



            {/* Confirm */}
            <div className="space-y-1">

              <Label>Confirm Password</Label>

              <Input
                type="password"
                placeholder="Re-enter password"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                disabled={loading}
              />

            </div>



            {/* Button */}
            <Button
              type="submit"
              className="w-full"
              disabled={loading}
            >

              {loading && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}

              Create Account

            </Button>


          </form>



          {/* Login */}
          <p className="text-center text-sm text-muted-foreground">

            Already have an account?{" "}

            <Link
              href="/login"
              className="font-medium text-primary hover:underline"
            >
              Login
            </Link>

          </p>


        </CardContent>

      </Card>

    </div>
  );
}
