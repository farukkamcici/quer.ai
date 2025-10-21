"use client";

import Image from "next/image";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Eye, EyeOff } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { motion } from "framer-motion";

export default function LoginForm({ onSwitch }) {
  const router = useRouter();
  const supabase = createClient();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPass, setShowPass] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });
      if (signInError) {
        setError(signInError.message);
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
      <button
        type="button"
        className="w-full rounded-lg border border-white/30 bg-white/90 px-3 py-2.5 text-sm font-medium text-neutral-900 transition hover:bg-white"
      >
        <span className="inline-flex w-full items-center justify-center gap-3">
          <span className="relative h-5 w-5">
            <Image src="/google-icon.svg" alt="Google" fill sizes="20px" />
          </span>
          <span className="tracking-tight">Continue with Google</span>
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
          <Input id="password" type={showPass ? 'text' : 'password'} autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder=" " required className="peer h-11 py-2 pr-10 text-neutral-100 border-white/20 bg-white/5 placeholder:text-white/70" />
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

      <div className="flex items-center justify-between text-xs">
        <span />
        <button type="button" className="text-blue-400 hover:text-blue-300">Forgot password?</button>
      </div>

      {error ? (
        <p className="text-sm text-red-500" role="alert">{error}</p>
      ) : null}

      <Button type="submit" variant="gradient" disabled={loading} className="w-full glow-pulse">
        {loading ? "Logging in..." : "Login"}
      </Button>
      <p className="text-center text-sm text-neutral-100">
        Don’t have an account? <button type="button" onClick={onSwitch} className="underline underline-offset-4">Sign up</button>
      </p>
    </form>
  );
}
