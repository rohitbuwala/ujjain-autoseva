"use client";

import { signIn, useSession } from "next-auth/react";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

import {
  Loader2,
  Eye,
  EyeOff,
} from "lucide-react";

import Link from "next/link";

import { FcGoogle } from "react-icons/fc";


export default function LoginPage() {

  const router = useRouter();
  const { status } = useSession();


  /* ================= AUTO REDIRECT ================= */

  useEffect(() => {
    if (status === "authenticated") {
      router.replace("/");
    }
  }, [status]);



  /* ================= STATES ================= */

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [showPass, setShowPass] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");



  /* ================= LOGIN ================= */

  async function handleLogin(e?: React.FormEvent) {

  if (e) e.preventDefault();

  setError("");


  if (!email || !password) {
    setError("Please enter email and password");
    return;
  }


  if (!email.includes("@")) {
    setError("Invalid email address");
    return;
  }


  setLoading(true);


  try {

    /* ================= CHECK USER FIRST ================= */

    const check = await fetch("/api/auth/check-user", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ email }),
    });


    if (!check.ok) {
      setLoading(false);
      setError("Account not found. Please register first.");
      return;
    }



    /* ================= THEN LOGIN ================= */

    const res = await signIn("credentials", {
      email,
      password,
      redirect: false,
    });


    setLoading(false);



    /* SUCCESS */
    if (res?.ok) {
      router.replace("/dashboard");
      return;
    }



    /* PASSWORD ERROR */
    if (res?.error === "CredentialsSignin") {
      setError("Invalid password. Please try again.");
      return;
    }



    setError("Login failed. Try again.");


  } catch (err) {

    console.error(err);

    setLoading(false);

    setError("Server error. Try later.");

  }

}




  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-background">

      <Card className="w-full max-w-md shadow-xl border-border">

        {/* ================= HEADER ================= */}
        <CardHeader className="text-center space-y-2">

          <CardTitle className="text-3xl font-bold">
            Welcome Back 👋
          </CardTitle>

          <CardDescription>
            Login to your account
          </CardDescription>

        </CardHeader>



        {/* ================= BODY ================= */}
        <CardContent className="space-y-5">


          {/* Error Box */}
            {error && (
              <div className="
                flex items-center gap-2
                bg-red-500/15
                text-red-500
                text-sm
                p-3
                rounded-md
                border border-red-500/30
              ">

                ⚠️ {error}

              </div>
            )}  




          <form
            className="space-y-4"
            onSubmit={handleLogin}
          >


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

              <div className="flex justify-between">

                <Label>Password</Label>

                <Link
                  href="/forgot"
                  className="text-xs text-primary hover:underline"
                >
                  Forgot?
                </Link>

              </div>


              <div className="relative">

                <Input
                  type={showPass ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={loading}
                />


                {/* Show/Hide */}
                <button
                  type="button"
                  onClick={() => setShowPass(!showPass)}
                  className="absolute right-3 top-2.5 text-muted-foreground"
                >

                  {showPass ? (
                    <EyeOff size={18} />
                  ) : (
                    <Eye size={18} />
                  )}

                </button>

              </div>

            </div>



            {/* Login Button */}
            <Button
              type="submit"
              className="w-full"
              disabled={loading}
            >

              {loading && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}

              Sign In

            </Button>


          </form>



          {/* Divider */}
          <div className="relative">

            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-muted" />
            </div>

            <div className="relative flex justify-center text-xs uppercase">

              <span className="bg-card px-2 text-muted-foreground">
                Or continue with
              </span>

            </div>

          </div>



          {/* Google Button */}
          <Button
            variant="outline"
            className="w-full flex gap-2"
            disabled={loading}
            onClick={() => signIn("google")}
          >

            <FcGoogle size={20} />

            Continue with Google

          </Button>


        </CardContent>



        {/* ================= FOOTER ================= */}
        <CardFooter>

          <p className="text-sm text-muted-foreground text-center w-full">

            Don&apos;t have an account?{" "}

            <Link
              href="/register"
              className="font-medium text-primary hover:underline"
            >
              Sign up
            </Link>

          </p>

        </CardFooter>

      </Card>

    </div>
  );
}
