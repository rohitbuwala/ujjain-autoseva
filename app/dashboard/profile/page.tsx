"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

export default function ProfilePage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [formData, setFormData] = useState({
    name: "",
    email: "",
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  // Initialize form when session loads
  if (!formData.name && session?.user) {
    setFormData({
      name: session.user.name || "",
      email: session.user.email || "",
    });
  }

  // Loading
  if (status === "loading") {
    return (
      <p className="text-center mt-20 text-gray-300">
        Loading...
      </p>
    );
  }

  // Not Logged In
  if (!session) {
    router.push("/login");
    return null;
  }

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
        setMessage(`Error: ${data.message || "Failed to update profile"}`);
        return;
      }

      setMessage("Profile updated successfully! ✅");
      setTimeout(() => {
        setMessage("");
      }, 3000);
    } catch (error) {
      setMessage("Error updating profile. Please try again.");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen px-4 py-10 mt-10">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <section className="glass p-6 mb-10">
          <h1 className="text-3xl md:text-4xl font-bold text-neon">
            Manage Your Profile
          </h1>
          <p className="text-gray-400 mt-2">
            Update your personal information
          </p>
        </section>

        {/* Profile Form */}
        <section className="glass p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Name Field */}
            <div>
              <label className="block text-white font-semibold mb-2">
                Full Name
              </label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                placeholder="Enter your name"
                className="
                  w-full px-4 py-3 rounded-lg
                  bg-white/5 border border-white/10
                  text-white placeholder:text-gray-500
                  focus:border-cyan-400 focus:outline-none
                  transition
                "
              />
            </div>

            {/* Email Field */}
            <div>
              <label className="block text-white font-semibold mb-2">
                Email Address
              </label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="Enter your email"
                className="
                  w-full px-4 py-3 rounded-lg
                  bg-white/5 border border-white/10
                  text-white placeholder:text-gray-500
                  focus:border-cyan-400 focus:outline-none
                  transition
                "
              />
            </div>

            {/* User Info (Read-only) */}
            <div className="bg-white/5 border border-white/10 rounded-lg p-4">
              <p className="text-gray-400 text-sm mb-2">User ID</p>
              <p className="text-white font-mono text-sm break-all">
                {session.user?.id}
              </p>
            </div>

            {/* Status Message */}
            {message && (
              <div
                className={`
                  p-4 rounded-lg text-sm font-medium
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

            {/* Buttons */}
            <div className="flex gap-3 pt-4">
              <Button
                type="submit"
                disabled={loading}
                className="
                  btn-neon px-8
                  disabled:opacity-50 disabled:cursor-not-allowed
                "
              >
                {loading ? "Saving..." : "Save Changes"}
              </Button>
              <Button
                type="button"
                variant="outline"
                className="
                  border-gray-400 text-gray-300
                  hover:bg-gray-500/10 px-8
                "
                onClick={() => router.push("/dashboard")}
              >
                Cancel
              </Button>
            </div>
          </form>
        </section>

        {/* Additional Info */}
        <section className="glass p-6 mt-10">
          <h2 className="text-xl font-bold text-white mb-4">
            Account Details
          </h2>
          <div className="space-y-3 text-sm">
            <div className="flex justify-between text-gray-300">
              <span>Role:</span>
              <span className="font-semibold capitalize">
                {session.user?.role || "User"}
              </span>
            </div>
            <div className="flex justify-between text-gray-300 pt-3 border-t border-white/10">
              <span>Email:</span>
              <span className="font-semibold">{session.user?.email}</span>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
