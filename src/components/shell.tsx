"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ThemeToggle } from "@/components/theme-toggle";

export function SpokeMark({ className = "spoke-mark" }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" className={className} aria-hidden="true">
      <circle cx="16" cy="16" r="4.2" fill="currentColor" />
      <circle cx="16" cy="16" r="11" fill="none" stroke="currentColor" strokeWidth="1.8" />
      {[0, 45, 90, 135].map((deg) => (
        <line
          key={deg}
          x1="16"
          y1="16"
          x2={16 + Math.cos((deg * Math.PI) / 180) * 11}
          y2={16 + Math.sin((deg * Math.PI) / 180) * 11}
          stroke="currentColor"
          strokeWidth="1.8"
        />
      ))}
    </svg>
  );
}

export function Shell({ children }: { children: React.ReactNode }) {
  const path = usePathname();
  return (
    <div className="mx-auto flex min-h-screen max-w-6xl flex-col px-4 pb-20 pt-5 sm:px-6">
      <header className="mb-8 flex items-center justify-between gap-3 rounded-full border border-line bg-surface/80 px-3 py-2 backdrop-blur-xl">
        <Link href="/" className="flex items-center gap-2 rounded-full px-2 py-1 hover:bg-white/5">
          <SpokeMark />
          <span className="display text-lg font-semibold">Spoke</span>
        </Link>
        <nav className="flex flex-wrap items-center justify-end gap-1 text-sm">
          <Link href="/" className={`nav-link ${path === "/" ? "nav-link-active" : ""}`}>
            Home
          </Link>
          <Link href="/#problems" className={`nav-link ${path.startsWith("/problems") ? "nav-link-active" : ""}`}>
            Problems
          </Link>
          <Link
            href="/attempts"
            className={`nav-link ${path.startsWith("/attempts") || path.startsWith("/review") || path.startsWith("/compare") || path.startsWith("/studio") ? "nav-link-active" : ""}`}
          >
            Attempts
          </Link>
          <ThemeToggle />
        </nav>
      </header>
      {children}
    </div>
  );
}
