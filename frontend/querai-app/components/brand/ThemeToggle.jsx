"use client";
import { useEffect, useState } from "react";
import { Sun, Moon } from "lucide-react";

function getSystemTheme() {
  if (typeof window === "undefined") return "light";
  return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches ? "dark" : "light";
}

export default function ThemeToggle({ inline = false, className = "" }) {
  const [theme, setTheme] = useState("light");
  useEffect(() => {
    const raw = localStorage.getItem("theme");
    const saved = raw === "light" || raw === "dark" ? raw : null;
    const initial = saved || getSystemTheme();
    setTheme(initial);
    document.documentElement.setAttribute("data-theme", initial);
  }, []);

  function toggle() {
    const next = theme === "light" ? "dark" : "light";
    setTheme(next);
    localStorage.setItem("theme", next);
    document.documentElement.setAttribute("data-theme", next);
    if (next === 'dark') { document.documentElement.classList.add('dark'); } else { document.documentElement.classList.remove('dark'); }
  }

  const base = inline
    ? "inline-flex h-8 w-8 items-center justify-center rounded-full border border-[var(--qr-border)] bg-[var(--qr-surface)] backdrop-blur text-[var(--qr-text)] shadow-[var(--qr-shadow-sm)] hover:bg-[color:var(--qr-hover)]"
    : "fixed bottom-4 right-4 z-50 inline-flex h-9 w-9 items-center justify-center rounded-full border border-[var(--qr-border)] bg-[var(--qr-surface)] backdrop-blur text-[var(--qr-text)] shadow-[var(--qr-shadow-sm)] hover:bg-[color:var(--qr-hover)]";
  return (
    <button aria-label="Toggle theme" onClick={toggle} className={`${base} ${className}`}>
      {theme === "dark" ? <Sun size={16} /> : <Moon size={16} />}
    </button>
  );
}
