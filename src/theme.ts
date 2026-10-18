import { useEffect, useState } from "react";

/** Light is the default (DESIGN.md); "system" follows the phone. */
export type Theme = "light" | "dark" | "system";
const KEY = "lp-agent.theme";

function read(): Theme {
  try {
    const v = localStorage.getItem(KEY);
    return v === "dark" || v === "system" ? v : "light";
  } catch {
    return "light";
  }
}

export function useTheme(): [Theme, (t: Theme) => void] {
  const [theme, setTheme] = useState<Theme>(read);
  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    // shadcn's dark: variants key off a .dark class; styles.css keys off data-theme.
    const mq = matchMedia("(prefers-color-scheme: dark)");
    const apply = () => {
      const dark = theme === "dark" || (theme === "system" && mq.matches);
      document.documentElement.classList.toggle("dark", dark);
      // Browser chrome matches the top bar surface.
      document.querySelector('meta[name="theme-color"]')?.setAttribute("content", dark ? "#0B0C0E" : "#FFFFFF");
    };
    apply();
    mq.addEventListener("change", apply);
    try {
      if (theme === "light") localStorage.removeItem(KEY);
      else localStorage.setItem(KEY, theme);
    } catch {
      // Storage blocked: the choice lasts for this visit only.
    }
    return () => mq.removeEventListener("change", apply);
  }, [theme]);
  return [theme, setTheme];
}
