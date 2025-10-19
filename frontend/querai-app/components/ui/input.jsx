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
        "h-9 w-full min-w-0 rounded-[var(--qr-radius-md)] border px-3 py-1 text-base md:text-sm outline-none transition-[background,box-shadow,border,color]",
        // Brand tokens surfaces/borders with subtle depth
        "border-[color:var(--qr-border)]/60 bg-[color:var(--qr-surface)]/60 text-[var(--qr-text)] backdrop-blur-md shadow-[inset_0_1px_2px_rgba(255,255,255,0.04)]",
        // Selection + caret
        "placeholder:text-[color:var(--qr-subtle)] selection:bg-[color:var(--qr-primary)]/20 caret-[color:var(--qr-primary)]",
        // Focus border + glow ring
        "focus-visible:border-[color:var(--qr-primary)]/70 focus-visible:ring-2 focus-visible:ring-[color:var(--qr-primary)]/20",
        // Disabled
        "disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-60",
        className
      )}
      {...props} />
  );
}

export { Input }
