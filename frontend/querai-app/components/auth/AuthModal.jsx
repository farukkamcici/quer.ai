"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Dialog, DialogContent, DialogOverlay, DialogTitle } from "@/components/ui/dialog";
import { AnimatePresence, motion } from "framer-motion";
import LoginForm from "@/components/auth/LoginForm";
import SignupForm from "@/components/auth/SignupForm";
import { X } from "lucide-react";

export default function AuthModal() {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const mode = params.get("auth"); // 'login' | 'signup' | null
  const open = mode === "login" || mode === "signup";
  const [internalMode, setInternalMode] = useState(mode || "login");

  useEffect(() => {
    if (mode) setInternalMode(mode);
  }, [mode]);

  // Lock body scroll when open
  useEffect(() => {
    if (open) {
      const prev = document.body.style.overflow;
      document.body.style.overflow = "hidden";
      return () => { document.body.style.overflow = prev; };
    }
  }, [open]);

  function close() {
    const next = new URLSearchParams(params.toString());
    next.delete("auth");
    router.replace(`${pathname}${next.toString() ? `?${next}` : ""}`);
  }

  function switchTo(nextMode) { setInternalMode(nextMode); }

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) close(); }}>
      <DialogOverlay className="backdrop-blur-xl bg-black/50" />
      {/* Transparent base; we render our own glass container inside */}
      <DialogContent className="p-0 bg-transparent border-transparent shadow-none">
        <DialogTitle className="sr-only">{internalMode === 'login' ? 'Welcome Back' : 'Create Account'}</DialogTitle>
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 6 }} transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}>
          {/* Centered dark glass panel to match landing */}
          <div className="relative mx-auto w-[520px] max-w-[92vw] overflow-hidden rounded-[var(--qr-radius-xl)] border border-white/10 bg-[#0b1529] backdrop-blur-2xl text-neutral-100 shadow-[0_0_40px_rgba(37,99,235,0.15)]">
            {/* Soft, larger radial glows behind */}
            <div aria-hidden className="pointer-events-none absolute inset-0 -z-10">
              <div className="absolute inset-0 bg-[radial-gradient(120%_120%_at_50%_-10%,_rgba(255,255,255,0.035),_transparent_60%)]" />
              <div className="absolute right-[-22%] bottom-[-22%] h-[28rem] w-[28rem] rounded-full bg-[radial-gradient(closest-side,_rgba(37,99,235,0.10),_transparent_70%)] blur-3xl" />
              <div className="absolute left-[-22%] top-[-22%] h-[24rem] w-[24rem] rounded-full bg-[radial-gradient(closest-side,_rgba(124,58,237,0.10),_transparent_70%)] blur-3xl" />
            </div>
            {/* Subtle inner ring */}
            <div aria-hidden className="pointer-events-none absolute inset-0 rounded-[var(--qr-radius-xl)] ring-1 ring-white/10" />

            {/* Header */}
            <div className="relative px-8 pt-8 pb-4">
              <button aria-label="Close" onClick={close} className="absolute right-3 top-3 inline-flex size-8 items-center justify-center rounded-full text-[color:var(--qr-text)]/70 hover:opacity-80 transition">
                <X className="h-4 w-4" />
              </button>
              <div className="text-center space-y-1">
                <h3 className="text-xl font-semibold tracking-tight">{internalMode === 'login' ? 'Welcome Back' : 'Create Account'}</h3>
                <p className="text-sm text-neutral-300">Querai helps you explore your data naturally.</p>
              </div>
            </div>

            {/* Content area with animated switch */}
            <div className="px-8 pb-4">
              <AnimatePresence mode="wait" initial={false}>
                <motion.div key={internalMode} initial={{ x: internalMode === 'login' ? 16 : -16, opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ x: internalMode === 'login' ? -16 : 16, opacity: 0 }} transition={{ duration: 0.6, ease: 'easeOut' }}>
                  {internalMode === 'login' ? (
                    <LoginForm onSwitch={() => switchTo('signup')} />
                  ) : (
                    <SignupForm onSwitch={() => switchTo('login')} />
                  )}
                </motion.div>
              </AnimatePresence>
            </div>

            {/* Footer segmented toggle - simpler, less dominant */}
            <div className="px-8 pt-2 pb-6">
              <div className="mx-auto flex w-full items-center justify-center">
                <div className="inline-flex items-center gap-1 rounded-full border border-white/30 bg-white/5 p-1 text-sm text-white/80">
                  <button
                    type="button"
                    onClick={() => switchTo('login')}
                    className={`min-w-40 rounded-full px-3 py-1.5 transition-colors ${
                      internalMode === 'login'
                        ? 'text-white bg-white/15 ring-1 ring-white/20 shadow-[inset_0_1px_0_rgba(255,255,255,0.15)]'
                        : 'text-white/85 hover:bg-white/10'
                    }`}
                  >
                    I have an account
                  </button>
                  <button
                    type="button"
                    onClick={() => switchTo('signup')}
                    className={`min-w-40 rounded-full px-3 py-1.5 transition-colors ${
                      internalMode === 'signup'
                        ? 'text-white bg-white/15 ring-1 ring-white/20 shadow-[inset_0_1px_0_rgba(255,255,255,0.15)]'
                        : 'text-white/85 hover:bg-white/10'
                    }`}
                  >
                    I don’t have an account
                  </button>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
        <style jsx>{`
          .glow-pulse { animation: glow 9s ease-in-out infinite; }
          @keyframes glow { 0%, 97%, 100% { box-shadow: 0 0 0 rgba(124,58,237,0); } 98% { box-shadow: 0 0 20px rgba(37,99,235,0.18); } 99% { box-shadow: 0 0 20px rgba(124,58,237,0.18); } }
        `}</style>
      </DialogContent>
    </Dialog>
  );
}
