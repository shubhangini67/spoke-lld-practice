"use client";

import { useEffect, useState } from "react";

export type ThemeName = "night" | "day";

export function readTheme(): ThemeName {
  if (typeof window === "undefined") return "night";
  const stored = window.localStorage.getItem("spoke-theme");
  if (stored === "day" || stored === "night") return stored;
  return window.matchMedia("(prefers-color-scheme: light)").matches ? "day" : "night";
}

export function applyTheme(theme: ThemeName) {
  document.documentElement.setAttribute("data-theme", theme);
  window.localStorage.setItem("spoke-theme", theme);
}

export function ThemeToggle() {
  const [theme, setTheme] = useState<ThemeName | null>(null);

  useEffect(() => {
    const current = readTheme();
    setTheme(current);
    applyTheme(current);
  }, []);

  function toggle() {
    if (!theme) return;
    const next = theme === "night" ? "day" : "night";
    setTheme(next);
    applyTheme(next);
  }

  const isDay = theme === "day";
  return (
    <button
      type="button"
      className="theme-toggle"
      onClick={toggle}
      aria-pressed={isDay}
      aria-label={isDay ? "Switch to night mode" : "Switch to day mode"}
      title={isDay ? "Night mode" : "Day mode"}
      suppressHydrationWarning
    >
      {!theme ? (
        <span className="flex items-center gap-2">Theme</span>
      ) : isDay ? (
        <span className="flex items-center gap-2">
          <MoonIcon /> Night
        </span>
      ) : (
        <span className="flex items-center gap-2">
          <SunIcon /> Day
        </span>
      )}
    </button>
  );
}

function SunIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle cx="12" cy="12" r="4" stroke="currentColor" strokeWidth="1.8" />
      <path
        d="M12 3v2M12 19v2M3 12h2M19 12h2M5.6 5.6l1.4 1.4M17 17l1.4 1.4M5.6 18.4 7 17M17 7l1.4-1.4"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  );
}

function MoonIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M17.5 14.5A7.5 7.5 0 0 1 9.5 6.5 6.5 6.5 0 1 0 17.5 14.5Z"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
    </svg>
  );
}
