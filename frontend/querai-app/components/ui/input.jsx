import * as React from "react"

import { cn } from "@/lib/utils"

function Input({
  className,
  type,
  ...props
}) {
  return (
    <input
      type={type}
      data-slot="input"
      className={cn(
        "h-9 w-full min-w-0 rounded-md border px-3 py-1 text-base md:text-sm outline-none transition-[background,box-shadow,border,color]",
        // Brand tokens
        "border-[var(--qr-border)] bg-[var(--qr-surface)] text-[var(--qr-text)] backdrop-blur",
        // Selection + placeholder
        "placeholder:text-[color:var(--qr-subtle)] selection:bg-[color:var(--qr-primary)]/20",
        // Focus ring
        "focus-visible:ring-2 focus-visible:ring-blue-600/40",
        // Disabled
        "disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-60",
        className
      )}
      {...props} />
  );
}

export { Input }
