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
    // Browser chrome matches the top bar surface.
    const dark = theme === "dark" || (theme === "system" && matchMedia("(prefers-color-scheme: dark)").matches);
    document.querySelector('meta[name="theme-color"]')?.setAttribute("content", dark ? "#111113" : "#FFFFFF");
    try {
      if (theme === "light") localStorage.removeItem(KEY);
      else localStorage.setItem(KEY, theme);
    } catch {
      // Storage blocked: the choice lasts for this visit only.
    }
  }, [theme]);
  return [theme, setTheme];
}
