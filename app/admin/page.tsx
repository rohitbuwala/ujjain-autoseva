"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import {
  FaTaxi,
  FaUsers,
  FaClipboardList,
  FaHome,
} from "react-icons/fa";
import AdminSkeleton from "@/components/AdminSkeleton";


export default function AdminDashboard() {

  const router = useRouter();

  const [stats, setStats] = useState({
    services: 0,
    bookings: 0,
    users: 0,
  });

  const [recentBookings, setRecentBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);


  /* ================= LOAD DATA ================= */

  useEffect(() => {

    async function loadDashboard() {

      try {

        const res = await fetch("/api/admin/dashboard");
        const data = await res.json();

        setStats({
          services: data.data?.services || 0,
          bookings: data.data?.bookings || 0,
          users: data.data?.users || 0,
        });

        setRecentBookings(data.data?.recentBookings || []);

      } catch (err) {
        console.error("DASHBOARD_LOAD_ERROR", err);
      }

      setLoading(false);
    }

    loadDashboard();

  }, []);


  /* ================= LOADING ================= */

  if (loading) {
    return <AdminSkeleton />;
  }


  /* ================= UI ================= */

  return (
    <div className="min-h-screen bg-white dark:bg-background text-slate-900 dark:text-white px-4 py-10 transition-colors">


      {/* ================= HEADER ================= */}

      <div className="max-w-7xl mx-auto mb-10">

        <h1 className="text-3xl sm:text-4xl font-bold gradient-text">
          Admin Dashboard
        </h1>

        <p className="text-slate-500 dark:text-slate-400 mt-1">
          Manage your system easily
        </p>

      </div>


      {/* ================= STATS ================= */}

      <div className="max-w-7xl mx-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">


        {/* Services */}
        <div className="card-safe p-6 flex items-center gap-5">

          <FaTaxi size={40} className="text-blue-600 dark:text-blue-400" />

          <div>
            <p className="text-slate-500 dark:text-slate-400 text-sm">
              Total Services
            </p>

            <h2 className="text-2xl font-bold">
              {stats.services}
            </h2>
          </div>

        </div>


        {/* Bookings */}
        <div className="card-safe p-6 flex items-center gap-5">

          <FaClipboardList size={40} className="text-emerald-600 dark:text-green-400" />

          <div>
            <p className="text-slate-500 dark:text-slate-400 text-sm">
              Total Bookings
            </p>

            <h2 className="text-2xl font-bold">
              {stats.bookings}
            </h2>
          </div>

        </div>


        {/* Users */}
        <div className="card-safe p-6 flex items-center gap-5">

          <FaUsers size={40} className="text-purple-600 dark:text-purple-400" />

          <div>
            <p className="text-slate-500 dark:text-slate-400 text-sm">
              Total Users
            </p>

            <h2 className="text-2xl font-bold">
              {stats.users}
            </h2>
          </div>

        </div>

      </div>


      {/* ================= QUICK ACTIONS ================= */}

      <div className="max-w-7xl mx-auto grid grid-cols-1 sm:grid-cols-3 gap-5 mb-12">


        <button
          onClick={() => router.push("/admin/services")}
          className="card-safe p-5 hover:scale-105 transition text-center"
        >
          <FaTaxi className="mx-auto mb-2" size={26} />
          Manage Services
        </button>


        <button
          onClick={() => router.push("/admin/bookings")}
          className="card-safe p-5 hover:scale-105 transition text-center"
        >
          <FaClipboardList className="mx-auto mb-2" size={26} />
          View Bookings
        </button>


        <button
          onClick={() => router.push("/")}
          className="card-safe p-5 hover:scale-105 transition text-center"
        >
          <FaHome className="mx-auto mb-2" size={26} />
          Go to Website
        </button>

      </div>


      {/* ================= RECENT BOOKINGS ================= */}

      <div className="max-w-7xl mx-auto">

        <h2 className="text-2xl font-semibold mb-5">
          Recent Bookings
        </h2>


        <div className="card-safe overflow-x-auto">

          <table className="w-full text-sm">

            <thead className="border-b border-slate-200 dark:border-white/10 text-slate-500 dark:text-slate-400">

              <tr>
                <th className="p-3 text-left">Name</th>
                <th className="p-3 text-left">Route</th>
                <th className="p-3 text-left">Price</th>
                <th className="p-3 text-left">Status</th>
              </tr>

            </thead>


            <tbody>

              {recentBookings.length === 0 && (

                <tr>
                  <td
                    colSpan={4}
                    className="p-4 text-center text-slate-500 dark:text-slate-400"
                  >
                    No bookings found
                  </td>
                </tr>

              )}


              {recentBookings.map((b, i) => (

                <tr
                  key={i}
                  className="border-b border-slate-100 dark:border-white/5 hover:bg-slate-50 dark:hover:bg-white/5"
                >

                  <td className="p-3">{b.name}</td>
                  <td className="p-3">{b.route}</td>
                  <td className="p-3">₹{b.price}</td>

                  <td className="p-3">

                    <span
                      className={`
                        px-2 py-1 rounded text-xs capitalize
                        ${b.status === "confirmed"
                          ? "bg-green-600"
                          : b.status === "rejected"
                            ? "bg-red-600"
                            : "bg-yellow-600"}
                      `}
                    >
                      {b.status}
                    </span>

                  </td>

                </tr>

              ))}

            </tbody>

          </table>

        </div>

      </div>

    </div>
  );
}
