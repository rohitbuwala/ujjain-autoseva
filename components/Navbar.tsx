"use client";

import { useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useSession, signOut } from "next-auth/react";

import { Button } from "@/components/ui/button";
import { Menu, X } from "lucide-react";

export default function Navbar() {

  const router = useRouter();
  const pathname = usePathname();

  const { data: session } = useSession();
  const [open, setOpen] = useState(false);

  return (
    <nav className="
      fixed top-0 left-0 w-full z-50
      bg-black/70 backdrop-blur-xl
      border-b border-white/10
    ">

      <div className="
        max-w-7xl mx-auto px-4 py-3
        flex items-center justify-between
      ">

        {/* LOGO */}
        <h1
          onClick={() => router.push("/")}
          className="
            text-xl md:text-2xl font-extrabold
            gradient-text cursor-pointer
            tracking-wide
          "
        >
          Ujjain AutoSeva
        </h1>

        {/* DESKTOP MENU */}
        <div className="hidden md:flex items-center gap-3">

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

              <Button
                onClick={() => signOut()}
                className="
                  bg-red-600/80 hover:bg-red-700
                  rounded-full px-5
                "
              >
                Logout
              </Button>
            </>
          ) : (
            <Button
              onClick={() => router.push("/login")}
              className="
                btn-neon rounded-full px-6 bg-blue-400 hover:bg-blue-600
              "
            >
              Login
            </Button>
          )}

        </div>

        {/* MOBILE TOGGLE */}
        <button
          onClick={() => setOpen(!open)}
          className="
            md:hidden text-white
            p-2 rounded-lg
            hover:bg-white/10
          "
        >
          {open ? <X size={26} /> : <Menu size={26} />}
        </button>

      </div>

      {/* MOBILE MENU */}
      {open && (
        <div className="
          md:hidden
          bg-black/90 backdrop-blur-xl
          border-t border-white/10
        ">

          <div className="flex flex-col p-4 gap-3">

            <MobileBtn
              title="Home"
              link="/"
              active={pathname === "/"}
              setOpen={setOpen}
            />

            <MobileBtn
              title="Services"
              link="/services"
              active={pathname === "/services"}
              setOpen={setOpen}
            />

            <MobileBtn
              title="Contact"
              link="/contact"
              active={pathname === "/contact"}
              setOpen={setOpen}
            />

            {session ? (
              <>
                <MobileBtn
                  title="Dashboard"
                  link="/dashboard"
                  active={pathname.startsWith("/dashboard")}
                  setOpen={setOpen}
                />

                <Button
                  onClick={() => signOut()}
                  className="bg-red-600"
                >
                  Logout
                </Button>
              </>
            ) : (
              <Button
                onClick={() => {
                  router.push("/login");
                  setOpen(false);
                }}
                className="btn-neon"
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
   DESKTOP NAV BUTTON
====================== */

function NavBtn({
  title,
  link,
  active,
}: {
  title: string;
  link: string;
  active: boolean;
}) {

  const router = useRouter();

  return (
    <button
      onClick={() => router.push(link)}
      className={`
        px-4 py-2 rounded-full text-sm font-medium
        transition-all duration-200

        ${
          active
            ? "bg-white/10 text-cyan-400 shadow"
            : "text-gray-300 hover:text-cyan-400 hover:bg-white/5"
        }
      `}
    >
      {title}
    </button>
  );
}


/* ======================
   MOBILE NAV BUTTON
====================== */

function MobileBtn({
  title,
  link,
  active,
  setOpen,
}: any) {

  const router = useRouter();

  return (
    <button
      onClick={() => {
        router.push(link);
        setOpen(false);
      }}
      className={`
        text-left px-3 py-2 rounded-lg
        transition

        ${
          active
            ? "bg-white/10 text-cyan-400"
            : "text-gray-300 hover:bg-white/5"
        }
      `}
    >
      {title}
    </button>
  );
}
