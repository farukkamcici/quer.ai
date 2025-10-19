// Querai Design System v1 — Tokens
// Lightweight tokens exposed to components/utilities.

export const color = {
  light: {
    bg: "#FAFAFA",
    surface: "rgba(255,255,255,0.7)",
    border: "rgba(0,0,0,0.05)",
    text: "#0F172A",
    subtle: "#64748B",
    primary: "#0b111f",
    accent: "#7C3AED",
  },
  dark: {
    bg: "#0B0C10",
    surface: "rgba(255,255,255,0.06)",
    border: "rgba(255,255,255,0.1)",
    text: "#E5E7EB",
    subtle: "#9CA3AF",
    primary: "#3B82F6",
    accent: "#8B5CF6",
  },
};

export const radius = {
  sm: "8px",
  md: "12px",
  lg: "16px",
  xl: "20px",
};

export const shadow = {
  sm: "0 1px 2px rgba(0,0,0,0.06)",
  md: "0 4px 16px rgba(0,0,0,0.08)",
  lg: "0 10px 30px rgba(0,0,0,0.12)",
};

export const motion = {
  fast: 0.2,
  base: 0.35,
  slow: 0.6,
  easing: {
    out: [0.16, 1, 0.3, 1],
    inOut: [0.8, 0, 0.2, 1],
  },
};

export const typography = {
  fontUi: "var(--font-plus-jakarta, 'Plus Jakarta Sans', system-ui, sans-serif)",
  fontMono: "var(--font-geist-mono, ui-monospace, SFMono-Regular, Menlo, monospace)",
  sizes: {
    h1: "clamp(28px, 3.5vw, 40px)",
    h2: "clamp(22px, 3vw, 32px)",
    body: "16px",
    small: "14px",
  },
};

export const tokens = { color, radius, shadow, motion, typography };
