import clsx from "clsx";

// variant: "plain" | "card" | "glass"
export function Surface({ variant = "plain", className = "", children }) {
  const base = "rounded-xl";
  const map = {
    plain: "bg-[var(--qr-surface-plain,transparent)]",
    card: "bg-[var(--qr-surface)] border border-[var(--qr-border)] shadow-[var(--qr-shadow-md)]",
    glass: "bg-[var(--qr-surface)] border border-[var(--qr-border)] backdrop-blur-md shadow-[var(--qr-shadow-md)]",
  };
  return <div className={clsx(base, map[variant], className)}>{children}</div>;
}
