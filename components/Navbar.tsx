"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useSession, signOut } from "next-auth/react";

import { Button } from "@/components/ui/button";
import { Menu, X, User, Shield, LogOut, List } from "lucide-react";

/* ======================
   NAVBAR
====================== */

export default function Navbar() {
  const router = useRouter();
  const pathname = usePathname();

  const { data: session } = useSession();
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <nav className="fixed top-0 left-0 w-full z-50 bg-black/70 backdrop-blur-xl border-b border-white/10 h-[64px]">
      <div className="max-w-7xl mx-auto px-4 h-full flex items-center justify-between">

        {/* LOGO */}
        <h1
          onClick={() => router.push("/")}
          className="text-xl md:text-2xl font-bold gradient-text cursor-pointer"
        >
          Ujjain AutoSeva
        </h1>

        {/* DESKTOP MENU */}
        <div className="hidden md:flex items-center gap-4 ml-auto">

          <NavBtn title="Home" link="/" active={pathname === "/"} />

          <NavBtn
            title="Services"
            link="/services"
            active={pathname === "/services"}
          />

          <NavBtn
            title="Contact"
            link="/contact"
            active={pathname === "/contact"}
          />

          {session ? (
            <>
              <NavBtn
                title="Dashboard"
                link="/dashboard"
                active={pathname.startsWith("/dashboard")}
              />

              {/* PROFILE ONLY */}
              <ProfileDropdown session={session} />

            </>
          ) : (
            <Button
              onClick={() => router.push("/login")}
              className="rounded-full px-6 bg-blue-500 hover:bg-blue-600"
            >
              Login
            </Button>
          )}
        </div>

        {/* MOBILE BUTTON */}
        <button
          onClick={() => setMobileOpen(!mobileOpen)}
          className="md:hidden text-white p-2 rounded-lg hover:bg-white/10"
        >
          {mobileOpen ? <X size={26} /> : <Menu size={26} />}
        </button>
      </div>

      {/* MOBILE MENU */}
      {mobileOpen && (
        <div className="md:hidden bg-black/90 border-t border-white/10">

          <div className="flex flex-col p-4 gap-3">

            <MobileBtn
              title="Home"
              link="/"
              active={pathname === "/"}
              close={setMobileOpen}
            />

            <MobileBtn
              title="Services"
              link="/services"
              active={pathname === "/services"}
              close={setMobileOpen}
            />

            <MobileBtn
              title="Contact"
              link="/contact"
              active={pathname === "/contact"}
              close={setMobileOpen}
            />

            {session ? (
              <>
                <MobileBtn
                  title="Dashboard"
                  link="/dashboard"
                  active={pathname.startsWith("/dashboard")}
                  close={setMobileOpen}
                />

                <MobileBtn
                  title="Profile"
                  link="/dashboard/profile"
                  active={pathname.startsWith("/dashboard/profile")}
                  close={setMobileOpen}
                />

                <MobileBtn
                  title="My Bookings"
                  link="/dashboard/booking"
                  active={pathname.startsWith("/dashboard/booking")}
                  close={setMobileOpen}
                />

                {/* LOGOUT */}
                <button
                  onClick={() => signOut()}
                  className="text-left px-3 py-2 rounded-lg text-red-400 hover:bg-red-500/10"
                >
                  Logout
                </button>
              </>
            ) : (
              <Button
                onClick={() => {
                  router.push("/login");
                  setMobileOpen(false);
                }}
              >
                Login
              </Button>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}

/* ======================
   PROFILE DROPDOWN
====================== */

function ProfileDropdown({ session }: any) {
  const router = useRouter();

  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }

    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const getInitials = (name: string) =>
    name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .slice(0, 2)
      .toUpperCase();

  return (
    <div ref={ref} className="relative">

      {/* ICON */}
      <button
        onClick={() => setOpen(!open)}
        className="w-9 h-9 rounded-full bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center text-white text-xs font-semibold hover:scale-105 transition"
      >
        {session.user?.image ? (
          <img
            src={session.user.image}
            className="w-full h-full rounded-full object-cover"
          />
        ) : (
          getInitials(session.user?.name || "U")
        )}
      </button>

      {/* DROPDOWN */}
      {open && (
        <div className="absolute right-0 top-12 w-60 bg-black/95 border border-white/10 rounded-xl shadow-xl z-50">

          {/* USER INFO */}
          <div className="p-4 border-b border-white/10">

            <p className="text-white font-medium text-sm">
              {session.user?.name}
            </p>

            <p className="text-gray-400 text-xs truncate">
              {session.user?.email}
            </p>

          </div>

          {/* MENU */}
          <div className="p-2 space-y-1">

            <MenuBtn
              icon={<User size={16} />}
              label="Profile"
              onClick={() => router.push("/dashboard/profile")}
              close={() => setOpen(false)}
            />

            <MenuBtn
              icon={<List size={16} />}
              label="My Bookings"
              onClick={() => router.push("/dashboard/booking")}
              close={() => setOpen(false)}
            />

            {/* ADMIN ONLY */}
            {session.user?.role === "admin" && (
              <>
                <MenuBtn
                  icon={<Shield size={16} />}
                  label="Admin Dashboard"
                  onClick={() => router.push("/admin")}
                  close={() => setOpen(false)}
                />

                <MenuBtn
                  icon={<List size={16} />}
                  label="Admin Bookings"
                  onClick={() => router.push("/admin/bookings")}
                  close={() => setOpen(false)}
                />

                <MenuBtn
                  icon={<Shield size={16} />}
                  label="Admin Services"
                  onClick={() => router.push("/admin/services")}
                  close={() => setOpen(false)}
                />
              </>
            )}

            <MenuBtn
              icon={<LogOut size={16} />}
              label="Logout"
              danger
              onClick={() => signOut()}
            />

          </div>
        </div>
      )}
    </div>
  );
}

/* ======================
   HELPERS
====================== */

function NavBtn({ title, link, active }: any) {
  const router = useRouter();

  return (
    <button
      onClick={() => router.push(link)}
      className={`px-4 py-2 rounded-full text-sm transition ${
        active
          ? "bg-white/10 text-cyan-400"
          : "text-gray-300 hover:text-cyan-400 hover:bg-white/5"
      }`}
    >
      {title}
    </button>
  );
}

function MobileBtn({ title, link, active, close }: any) {
  const router = useRouter();

  return (
    <button
      onClick={() => {
        router.push(link);
        close(false);
      }}
      className={`text-left px-3 py-2 rounded-lg ${
        active
          ? "bg-white/10 text-cyan-400"
          : "text-gray-300 hover:bg-white/5"
      }`}
    >
      {title}
    </button>
  );
}

function MenuBtn({ icon, label, onClick, close, danger }: any) {
  return (
    <button
      onClick={() => {
        onClick();
        close && close();
      }}
      className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm ${
        danger
          ? "text-red-400 hover:bg-red-500/10"
          : "text-gray-300 hover:bg-white/10"
      }`}
    >
      {icon}
      {label}
    </button>
  );
}
