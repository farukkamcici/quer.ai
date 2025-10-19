"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Eye, EyeOff } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { motion } from "framer-motion";

export default function SignupForm({ onSwitch }) {
  const router = useRouter();
  const supabase = createClient();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const { error: signUpError } = await supabase.auth.signUp({ email, password });
      if (signUpError) {
        setError(signUpError.message);
        return;
      }
      router.replace("/home");
    } catch {
      setError("Unexpected error. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {/* Social auth */}
      <button type="button" className="w-full rounded-md border border-[color:var(--qr-border)]/60 bg-[color:var(--qr-surface)]/20 px-3 py-2 text-sm text-neutral-100 hover:bg-[color:var(--qr-surface)]/30 transition">
        <span className="inline-flex items-center gap-2">
          <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden="true">
            <path fill="#FFC107" d="M43.6 20.5H42v-.1H24v7.2h11.3C33.9 31 29.4 34 24 34c-7.2 0-13-5.8-13-13s5.8-13 13-13c3.3 0 6.3 1.2 8.6 3.2l5.1-5.1C34.9 3.4 29.7 1.5 24 1.5 11.5 1.5 1.5 11.5 1.5 24S11.5 46.5 24 46.5 46.5 36.5 46.5 24c0-1.1-.1-2.2-.3-3.5z"/>
            <path fill="#FF3D00" d="M6.3 14.7l5.9 4.3C13.8 16 18.5 13 24 13c3.3 0 6.3 1.2 8.6 3.2l5.1-5.1C34.9 7.4 29.7 5.5 24 5.5c-7.8 0-14.5 4.4-17.7 10.9z"/>
            <path fill="#4CAF50" d="M24 42.5c5.3 0 10.2-2 13.8-5.2l-6.4-5c-2.1 1.5-4.8 2.4-7.4 2.4-5.4 0-10-3.6-11.6-8.6l-6.1 4.7C9.4 37.7 16.1 42.5 24 42.5z"/>
            <path fill="#1976D2" d="M43.6 20.5H42v-.1H24v7.2h11.3c-1.3 3.9-5.1 6.8-9.3 6.8-2.7 0-5.2-1.1-7-2.9l-6.1 4.7C15.9 40.6 19.7 42.5 24 42.5c7.9 0 14.5-4.8 17-11.7.9-2.2 1.4-4.7 1.4-7.3 0-1.1-.1-2.2-.3-3.5z"/>
          </svg>
          Sign up with Google
        </span>
      </button>

      {/* Divider */}
      <div className="relative py-2 text-center">
        <div className="flex items-center gap-3">
          <span className="h-px flex-1 bg-white/30" />
          <span className="text-white text-xs font-medium tracking-wide">OR</span>
          <span className="h-px flex-1 bg-white/30" />
        </div>
      </div>

      {/* Inputs with floating labels + staggered fade-in */}
      <motion.div
        className="space-y-4"
        initial="hidden"
        animate="show"
        variants={{ hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.08 } } }}
      >
        <motion.div variants={{ hidden: { opacity: 0, y: 4 }, show: { opacity: 1, y: 0 } }} className="relative">
          <Input id="email" type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder=" " required className="peer h-11 py-2 text-neutral-100 border-white/20 bg-white/5 placeholder:text-white/70" />
          <Label
            htmlFor="email"
            className="pointer-events-none absolute left-3 top-2.5 origin-left text-[13px] font-medium text-white transition-all duration-200 ease-[cubic-bezier(0.16,1,0.3,1)] transform-gpu
                       peer-placeholder-shown:top-2.5 peer-placeholder-shown:text-[13px]
                       peer-focus:-top-2 peer-focus:text-xs peer-focus:text-white
                       peer-[&:not(:placeholder-shown)]:-top-2 peer-[&:not(:placeholder-shown)]:text-xs peer-[&:not(:placeholder-shown)]:text-white"
          >
            Email
          </Label>
        </motion.div>
        <motion.div variants={{ hidden: { opacity: 0, y: 4 }, show: { opacity: 1, y: 0 } }} className="relative">
          <Input id="password" type={showPass ? 'text' : 'password'} autoComplete="new-password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder=" " required className="peer h-11 py-2 pr-10 text-neutral-100 border-white/20 bg-white/5 placeholder:text-white/70" />
          <Label
            htmlFor="password"
            className="pointer-events-none absolute left-3 top-2.5 origin-left text-[13px] font-medium text-white transition-all duration-200 ease-[cubic-bezier(0.16,1,0.3,1)] transform-gpu
                       peer-placeholder-shown:top-2.5 peer-placeholder-shown:text-[13px]
                       peer-focus:-top-2 peer-focus:text-xs peer-focus:text-white
                       peer-[&:not(:placeholder-shown)]:-top-2 peer-[&:not(:placeholder-shown)]:text-xs peer-[&:not(:placeholder-shown)]:text-white"
          >
            Password
          </Label>
          <button type="button" onClick={() => setShowPass((v) => !v)} aria-label={showPass ? 'Hide password' : 'Show password'} className="absolute right-2 top-2.5 inline-flex items-center justify-center text-neutral-300 hover:text-neutral-100">
            {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
          </button>
        </motion.div>
      </motion.div>

      {error ? (
        <p className="text-sm text-red-500" role="alert">{error}</p>
      ) : null}

      <Button type="submit" variant="gradient" disabled={loading} className="w-full glow-pulse">
        {loading ? "Signing up..." : "Sign Up"}
      </Button>
      <p className="text-center text-sm text-neutral-100">
        Already have an account? <button type="button" onClick={onSwitch} className="underline underline-offset-4">Sign in</button>
      </p>
    </form>
  );
}
