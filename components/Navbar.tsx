"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useSession, signOut } from "next-auth/react";

import { Button } from "@/components/ui/button";
import { Menu, X } from "lucide-react";

export default function Navbar() {
  const router = useRouter();
  const { data: session } = useSession();
  const [open, setOpen] = useState(false);

  return (
    <nav className="fixed top-0 left-0 w-full z-50 bg-gradient-to-r from-black via-blue-950 to-purple-950 backdrop-blur border-b border-white/10">

      <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">

        {/* Logo */}
        <h1
          onClick={() => router.push("/")}
          className="text-xl md:text-2xl font-bold gradient-text cursor-pointer"
        >
          Ujjain AutoSeva
        </h1>

        {/* Desktop Menu */}
        <div className="hidden md:flex items-center gap-4">

          <NavBtn title="Home" link="/" />
          <NavBtn title="Services" link="/services" />
          <NavBtn title="Contact" link="/contact" />

          {session ? (
            <>
              <Button
                variant="outline"
                onClick={() => router.push("/dashboard")}
              >
                Dashboard
              </Button>

              <Button
                className="btn-neon"
                onClick={() => signOut()}
              >
                Logout
              </Button>
            </>
          ) : (
            <>
              <Button
                variant="outline"
                onClick={() => router.push("/login")}
              >
                Login
              </Button>

              <Button
                className="btn-neon"
                onClick={() => router.push("/register")}
              >
                Register
              </Button>
            </>
          )}

        </div>

        {/* Mobile Menu Button */}
        <button
          onClick={() => setOpen(!open)}
          className="md:hidden text-white"
        >
          {open ? <X size={28} /> : <Menu size={28} />}
        </button>

      </div>

      {/* Mobile Menu */}
      {open && (
        <div className="md:hidden bg-black/90 border-t border-white/10">

          <div className="flex flex-col p-4 gap-3">

            <MobileBtn title="Home" link="/" setOpen={setOpen} />
            <MobileBtn title="Services" link="/services" setOpen={setOpen} />
            <MobileBtn title="Contact" link="/contact" setOpen={setOpen} />

            {session ? (
              <>
                <MobileBtn
                  title="Dashboard"
                  link="/dashboard"
                  setOpen={setOpen}
                />

                <Button
                  className="btn-neon"
                  onClick={() => signOut()}
                >
                  Logout
                </Button>
              </>
            ) : (
              <>
                <MobileBtn
                  title="Login"
                  link="/login"
                  setOpen={setOpen}
                />

                <MobileBtn
                  title="Register"
                  link="/register"
                  setOpen={setOpen}
                />
              </>
            )}

          </div>

        </div>
      )}

    </nav>
  );
}

/* Components */

function NavBtn({ title, link }: any) {
  const router = useRouter();

  return (
    <Button
      variant="ghost"
      onClick={() => router.push(link)}
      className="nav-link"
    >
      {title}
    </Button>
  );
}

function MobileBtn({ title, link, setOpen }: any) {
  const router = useRouter();

  return (
    <button
      onClick={() => {
        router.push(link);
        setOpen(false);
      }}
      className="text-left text-white py-2 border-b border-white/10"
    >
      {title}
    </button>
  );
}
