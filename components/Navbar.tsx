"use client";

import { useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Menu, X, User, LogOut, LayoutDashboard } from "lucide-react";
import { ThemeToggle } from "@/components/ThemeToggle";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

export default function Navbar() {
  const router = useRouter();
  const pathname = usePathname();
  const { data: session } = useSession();
  const [mobileOpen, setMobileOpen] = useState(false);

  const navLinks = [
    { title: "Home", link: "/" },
    { title: "Services", link: "/services" },
    { title: "Contact", link: "/contact" },
  ];

  return (
    <nav className="fixed top-0 left-0 w-full z-50 bg-background/95 backdrop-blur-md border-b border-border h-16">
      <div className="container-custom h-full flex items-center justify-between">

        {/* LOGO */}
        <div
          onClick={() => router.push("/")}
          className="flex items-center gap-2 cursor-pointer"
        >
          <span className="text-xl md:text-2xl font-bold text-primary tracking-tight">
            Ujjain <span className="text-foreground">AutoSeva</span>
          </span>
        </div>

        {/* DESKTOP NAV */}
        <div className="hidden md:flex items-center gap-6">
          <div className="flex items-center gap-1">
            {navLinks.map((nav) => (
              <Button
                key={nav.title}
                variant="ghost"
                onClick={() => router.push(nav.link)}
                className={`text-sm font-medium ${pathname === nav.link
                  ? "text-primary bg-accent/50"
                  : "text-muted-foreground hover:text-primary"
                  }`}
              >
                {nav.title}
              </Button>
            ))}
          </div>

          <div className="flex items-center gap-3 pl-4 border-l border-border">
            <ThemeToggle />

            {session ? (
              <UserDropdown session={session} />
            ) : (
              <Button
                onClick={() => router.push("/login")}
                size="sm"
                className="bg-primary text-primary-foreground hover:bg-primary/90"
              >
                Login
              </Button>
            )}
          </div>
        </div>

        {/* MOBILE TOGGLE */}
        <div className="flex items-center gap-3 md:hidden">
          <ThemeToggle />
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="p-2 text-foreground hover:bg-accent rounded-md"
          >
            {mobileOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </div>

      {/* MOBILE MENU */}
      {mobileOpen && (
        <div className="md:hidden absolute top-16 left-0 w-full bg-background border-b border-border shadow-lg animate-in slide-in-from-top-2">
          <div className="p-4 flex flex-col gap-2">
            {navLinks.map((nav) => (
              <Button
                key={nav.title}
                variant="ghost"
                className={`w-full justify-start ${pathname === nav.link ? "bg-accent text-primary" : ""}`}
                onClick={() => {
                  router.push(nav.link);
                  setMobileOpen(false);
                }}
              >
                {nav.title}
              </Button>
            ))}

            <div className="h-px bg-border my-2" />

            {session ? (
              <>
                <Button
                  variant="ghost"
                  className="w-full justify-start gap-2"
                  onClick={() => {
                    router.push("/dashboard");
                    setMobileOpen(false);
                  }}
                >
                  <LayoutDashboard size={16} />
                  Dashboard
                </Button>
                <Button
                  variant="ghost"
                  className="w-full justify-start gap-2 text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/20"
                  onClick={() => signOut()}
                >
                  <LogOut size={16} />
                  Logout
                </Button>
              </>
            ) : (
              <Button
                className="w-full bg-primary text-primary-foreground"
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

function UserDropdown({ session }: { session: any }) {
  const router = useRouter();
  const user = session?.user;

  const initials = user?.name
    ? user.name.split(" ").map((n: string) => n[0]).join("").slice(0, 2).toUpperCase()
    : "UA";

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="relative h-9 w-9 rounded-full">
          <Avatar className="h-9 w-9">
            <AvatarImage src={user?.image || ""} alt={user?.name || ""} />
            <AvatarFallback className="bg-primary/10 text-primary">
              {initials}
            </AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56" align="end" forceMount>
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-medium leading-none">{user?.name}</p>
            <p className="text-xs leading-none text-muted-foreground">
              {user?.email}
            </p>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => router.push("/dashboard")}>
          <LayoutDashboard className="mr-2 h-4 w-4" />
          <span>Dashboard</span>
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => router.push("/dashboard/profile")}>
          <User className="mr-2 h-4 w-4" />
          <span>Profile</span>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          className="text-red-600 focus:text-red-600"
          onClick={() => signOut()}
        >
          <LogOut className="mr-2 h-4 w-4" />
          <span>Log out</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
