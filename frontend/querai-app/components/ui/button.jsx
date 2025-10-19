import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva } from "class-variance-authority";

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-all cursor-pointer disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 shrink-0 [&_svg]:shrink-0 outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive",
  {
    variants: {
      variant: {
        // Unified brand: use qr-primary in both light/dark
        default: "bg-[var(--qr-primary)] text-[var(--primary-foreground)] hover:opacity-95 dark:hover:bg-[color:var(--qr-hover)]",
        primary: "bg-[var(--qr-primary)] text-[var(--primary-foreground)] hover:opacity-95 dark:hover:bg-[color:var(--qr-hover)]",
        // Premium gradient button using brand hues (#2563EB → #7C3AED) with subtle motion
        gradient: "text-white bg-[linear-gradient(90deg,#2563EB,#7C3AED)] bg-[length:200%_100%] bg-[position:0%_50%] transition-[transform,background-position,opacity] duration-300 ease-out hover:bg-[position:100%_50%] hover:-translate-y-px hover:scale-[1.02]",
        destructive:
          "bg-destructive text-white hover:bg-destructive/90 focus-visible:ring-destructive/20 dark:focus-visible:ring-destructive/40 dark:bg-destructive/60",
        outline:
          "border border-[var(--qr-border)] bg-[var(--qr-surface)] text-[var(--qr-text)] shadow-xs hover:bg-[color:var(--qr-hover)]",
        secondary:
          "bg-[var(--qr-primary)] text-[var(--primary-foreground)] hover:opacity-95 dark:hover:bg-[color:var(--qr-hover)]",
        ghost:
          "text-[var(--qr-text)] hover:bg-[color:var(--qr-hover)]",
        link: "text-primary underline-offset-4 hover:underline",
      },
      size: {
        default: "h-9 px-4 py-2 has-[>svg]:px-3",
        sm: "h-8 rounded-md gap-1.5 px-3 has-[>svg]:px-2.5",
        lg: "h-10 rounded-md px-6 has-[>svg]:px-4",
        icon: "size-9",
        "icon-sm": "size-8",
        "icon-lg": "size-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

function Button({
  className,
  variant,
  size,
  asChild = false,
  ...props
}) {
  const Comp = asChild ? Slot : "button"

  return (
    <Comp
      data-slot="button"
      className={cn(buttonVariants({ variant, size, className }))}
      {...props} />
  );
}

export { Button, buttonVariants }
