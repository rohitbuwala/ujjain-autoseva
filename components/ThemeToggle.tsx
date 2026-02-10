"use client";

import * as React from "react";
import { Moon, Sun, Monitor } from "lucide-react";
import { useTheme } from "next-themes";
import { Button } from "@/components/ui/button";

export function ThemeToggle() {
    const { setTheme, theme } = useTheme();
    const [mounted, setMounted] = React.useState(false);

    React.useEffect(() => {
        setMounted(true);
    }, []);

    if (!mounted) {
        return (
            <Button variant="ghost" size="icon" className="w-10 h-10">
                <span className="sr-only">Toggle theme</span>
            </Button>
        );
    }

    return (
        <div className="flex items-center gap-1 border border-border rounded-full p-1 bg-card">
            <Button
                variant="ghost"
                size="icon"
                onClick={() => setTheme("light")}
                className={`w-8 h-8 rounded-full ${theme === "light" ? "bg-accent text-accent-foreground shadow-sm" : "hover:bg-muted"}`}
            >
                <Sun className="h-4 w-4" />
                <span className="sr-only">Light</span>
            </Button>
            <Button
                variant="ghost"
                size="icon"
                onClick={() => setTheme("dark")}
                className={`w-8 h-8 rounded-full ${theme === "dark" ? "bg-accent text-accent-foreground shadow-sm" : "hover:bg-muted"}`}
            >
                <Moon className="h-4 w-4" />
                <span className="sr-only">Dark</span>
            </Button>
            <Button
                variant="ghost"
                size="icon"
                onClick={() => setTheme("system")}
                className={`w-8 h-8 rounded-full ${theme === "system" ? "bg-accent text-accent-foreground shadow-sm" : "hover:bg-muted"}`}
            >
                <Monitor className="h-4 w-4" />
                <span className="sr-only">System</span>
            </Button>
        </div>
    );
}
