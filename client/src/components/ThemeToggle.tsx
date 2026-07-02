import { useEffect } from "react";

export function ThemeToggle() {
  useEffect(() => {
    // Force light mode only - remove dark class if present
    document.documentElement.classList.remove("dark");
    localStorage.setItem("theme", "light");
  }, []);

  // Component no longer renders anything - light mode is enforced
  return null;
}
