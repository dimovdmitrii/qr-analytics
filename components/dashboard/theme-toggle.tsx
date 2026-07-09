"use client";

import { useState } from "react";
import { Moon, Sun } from "lucide-react";
import { Button } from "@/components/ui/button";

// `initialDark` comes from the server (resolved from the `theme` cookie), so the
// first client render matches the server render exactly — no hydration mismatch.
export function ThemeToggle({ initialDark = false }: { initialDark?: boolean }) {
  const [isDark, setIsDark] = useState(initialDark);

  function toggle() {
    const next = !isDark;
    setIsDark(next);
    document.documentElement.classList.toggle("dark", next);
    // Persist as a cookie so the server can set the class on the next load.
    document.cookie = `theme=${next ? "dark" : "light"}; path=/; max-age=31536000; samesite=lax`;
  }

  return (
    <Button variant="ghost" size="icon" onClick={toggle} aria-label="Toggle dark mode">
      {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
    </Button>
  );
}
