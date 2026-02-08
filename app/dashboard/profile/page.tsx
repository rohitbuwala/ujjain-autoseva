"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";

import { User, Mail, Shield } from "lucide-react";


export default function ProfilePage() {

  const { data: session, status } = useSession();
  const router = useRouter();


  const [formData, setFormData] = useState({
    name: "",
    email: "",
  });

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");


  /* ================= INIT FORM ================= */

  useEffect(() => {

    if (session?.user) {
      setFormData({
        name: session.user.name || "",
        email: session.user.email || "",
      });
    }

  }, [session]);


  /* ================= LOADING ================= */

  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center text-gray-300">
        Loading profile...
      </div>
    );
  }


  /* ================= AUTH ================= */

  if (!session) {
    router.push("/login");
    return null;
  }


  /* ================= HANDLERS ================= */

  const handleChange = (e: any) => {

    const { name, value } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

  };


  const handleSubmit = async (e: any) => {

    e.preventDefault();

    setLoading(true);
    setMessage("");

    try {

      const response = await fetch("/api/auth/profile", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userId: session.user?.id,
          name: formData.name,
          email: formData.email,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setMessage(`Error: ${data.message || "Update failed"}`);
        return;
      }

      setMessage("Profile updated successfully ✅");

      setTimeout(() => setMessage(""), 3000);

    } catch (error) {

      setMessage("Error updating profile. Try again.");

    } finally {

      setLoading(false);

    }

  };


  /* ================= UI ================= */

  return (
    <div
      className="
        min-h-screen
        px-4
        sm:px-6
        lg:px-8

        py-8
        sm:py-10
      "
    >

      <div className="max-w-3xl mx-auto space-y-10">


        {/* ================= HEADER ================= */}

        <section
          className="
            card-safe

            p-5
            sm:p-6
            lg:p-8

            space-y-2
          "
        >

          <h1
            className="
              text-xl
              sm:text-2xl
              md:text-3xl

              font-bold
              gradient-text
            "
          >
            Manage Profile
          </h1>

          <p className="text-gray-400 text-sm sm:text-base">
            Update your personal information
          </p>

        </section>



        {/* ================= FORM ================= */}

        <section className="card-safe p-5 sm:p-6 lg:p-8">

          <form onSubmit={handleSubmit} className="space-y-6">


            {/* NAME */}
            <div className="space-y-1">

              <label className="flex items-center gap-2 text-sm font-semibold">

                <User size={16} />
                Full Name

              </label>

              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                placeholder="Enter full name"
                className="
                  w-full

                  px-4
                  py-3

                  rounded-lg

                  bg-black/40
                  border
                  border-white/15

                  text-white
                  placeholder:text-gray-500

                  focus:border-cyan-400
                  focus:ring-2
                  focus:ring-cyan-400/20
                  focus:outline-none

                  transition
                "
              />

            </div>


            {/* EMAIL */}
            <div className="space-y-1">

              <label className="flex items-center gap-2 text-sm font-semibold">

                <Mail size={16} />
                Email Address

              </label>

              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="Enter email"
                className="
                  w-full

                  px-4
                  py-3

                  rounded-lg

                  bg-black/40
                  border
                  border-white/15

                  text-white
                  placeholder:text-gray-500

                  focus:border-cyan-400
                  focus:ring-2
                  focus:ring-cyan-400/20
                  focus:outline-none

                  transition
                "
              />

            </div>



            {/* USER ID */}
            <div
              className="
                bg-black/30
                border
                border-white/10

                rounded-lg

                p-4

                space-y-1
              "
            >

              <p className="text-xs text-gray-400">
                User ID
              </p>

              <p className="font-mono text-sm break-all text-white">
                {session.user?.id}
              </p>

            </div>



            {/* MESSAGE */}
            {message && (

              <div
                className={`
                  p-3
                  rounded-lg
                  text-sm

                  ${
                    message.includes("Error")
                      ? "bg-red-500/20 text-red-300 border border-red-500/30"
                      : "bg-green-500/20 text-green-300 border border-green-500/30"
                  }
                `}
              >
                {message}
              </div>

            )}



            {/* BUTTONS */}
            <div
              className="
                flex
                flex-col
                sm:flex-row

                gap-3
                pt-4
              "
            >

              <Button
                type="submit"
                disabled={loading}
                className="
                  btn-primary

                  w-full
                  sm:w-auto

                  px-6

                  disabled:opacity-50
                "
              >
                {loading ? "Saving..." : "Save Changes"}
              </Button>


              <Button
                type="button"
                variant="outline"
                className="
                  w-full
                  sm:w-auto

                  border-gray-400
                  text-gray-300

                  hover:bg-gray-500/10

                  px-6
                "
                onClick={() => router.push("/dashboard")}
              >
                Cancel
              </Button>

            </div>

          </form>

        </section>



        {/* ================= ACCOUNT INFO ================= */}

        <section className="card-safe p-5 sm:p-6 space-y-4">

          <h2 className="text-lg font-semibold flex items-center gap-2">

            <Shield size={18} />
            Account Details

          </h2>


          <div className="space-y-3 text-sm">

            <div className="flex justify-between text-gray-300">

              <span>Role</span>

              <span className="font-medium capitalize">
                {session.user?.role || "User"}
              </span>

            </div>


            <div className="flex justify-between text-gray-300 border-t border-white/10 pt-3">

              <span>Email</span>

              <span className="font-medium break-all">
                {session.user?.email}
              </span>

            </div>

          </div>

        </section>


      </div>

    </div>
  );
}
