"use client";
// Hero section for the marketing landing page
// Modernized with subtle gradients, glass blur, and motion

import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";

export default function Hero() {
  return (
    <section className="relative overflow-hidden bg-[#0b1529]">
      {/* Background accent: soft gradient blob + blur */}
      <div aria-hidden className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute left-1/2 top-[-10%] h-[40rem] w-[40rem] -translate-x-1/2 rounded-full bg-[radial-gradient(closest-side,_rgba(59,130,246,0.18),_transparent_70%)] blur-3xl" />
        <div className="absolute right-[-10%] bottom-[-10%] h-[28rem] w-[28rem] rounded-full bg-[radial-gradient(closest-side,_rgba(124,58,237,0.16),_transparent_70%)] blur-3xl" />
      </div>

      <div className="mx-auto max-w-7xl px-4 pt-16 pb-8 sm:pt-24 sm:pb-12">
        {/* Logo */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="mb-8 flex items-center justify-center gap-2"
        >
          <Image src="/icon-light.svg" alt="Querai logo" width={32} height={32} />
          <span className="text-sm font-medium tracking-wide text-neutral-200">Querai</span>
        </motion.div>

        {/* Headline & subheadline */}
        <div className="mx-auto max-w-3xl text-center">
          <motion.h1
            initial={{ opacity: 0, y: 18 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-4xl font-semibold tracking-tight text-neutral-50 sm:text-5xl"
          >
            <span className="relative inline-block shimmer-text">
              Powerful analytics without the wait.
            </span>
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 18 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7, delay: 0.1 }}
            className="mt-4 text-base leading-7 text-neutral-300 sm:text-lg"
          >
            Connect your data sources and ask questions in plain English — no SQL required.
          </motion.p>
        </div>

        {/* CTAs */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.15 }}
          className="mt-8 flex items-center justify-center gap-3"
        >
          <Link
            href="/?auth=signup"
            className="inline-flex items-center rounded-md bg-gradient-to-r from-blue-500 to-indigo-500 px-4 py-2 text-sm font-medium text-white shadow-sm hover:opacity-90 transition transform-gpu hover:scale-[1.03] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/40 glow-pulse"
          >
            Get started
          </Link>
          <Link
            href="#features"
            className="inline-flex items-center rounded-md border border-white/20 bg-white/10 px-4 py-2 text-sm font-medium text-neutral-100 shadow-sm backdrop-blur hover:bg-white/15 transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/30"
          >
            Learn more
          </Link>
        </motion.div>

        {/* Product visual placeholder */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7, delay: 0.1 }}
          className="mx-auto mt-12 max-w-5xl"
        >
          <div className="relative rounded-xl border border-white/10 bg-white/5 p-3 shadow-sm backdrop-blur-md">
            {/* Simple browser-like chrome */}
            <div className="flex items-center gap-1 px-2 py-1">
              <span className="h-2.5 w-2.5 rounded-full bg-red-400" />
              <span className="h-2.5 w-2.5 rounded-full bg-yellow-400" />
              <span className="h-2.5 w-2.5 rounded-full bg-green-400" />
              <span className="ml-3 text-xs text-neutral-400">app.querai</span>
            </div>
            <div className="rounded-lg border border-white/10 bg-gradient-to-b from-indigo-950/40 to-transparent p-6">
              <div className="mx-auto max-w-3xl">
                <Image
                  src="/window.svg"
                  alt="Querai product preview"
                  width={1200}
                  height={720}
                  className="h-auto w-full"
                  priority
                />
              </div>
            </div>
          </div>
        </motion.div>
      </div>
      {/* Local styles for shimmer and glow pulse */}
      <style jsx>{`
        .shimmer-text {
          background: linear-gradient(90deg, #e5e7eb, #e5e7eb, #60a5fa, #a78bfa, #e5e7eb);
          background-size: 200% 100%;
          -webkit-background-clip: text;
          background-clip: text;
          color: transparent;
          animation: shimmer-move 6s linear infinite;
        }
        @keyframes shimmer-move {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
        .glow-pulse {
          animation: glow 9s ease-in-out infinite;
        }
        @keyframes glow {
          0%, 97%, 100% { box-shadow: 0 0 0 rgba(124, 58, 237, 0); }
          98% { box-shadow: 0 0 24px rgba(59, 130, 246, 0.25); }
          99% { box-shadow: 0 0 24px rgba(167, 139, 250, 0.25); }
        }
      `}</style>
    </section>
  );
}
