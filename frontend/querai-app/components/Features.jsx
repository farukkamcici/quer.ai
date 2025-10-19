"use client";
// Modern features grid: 4 floating panels, glass + gradients + motion
// Icons from lucide-react

import { motion } from "framer-motion";
import { Brain, BarChart3, Lock, Users } from "lucide-react";

const FEATURES = [
  { title: "Ask anything", desc: "Query your data in natural language", Icon: Brain },
  { title: "Instant insights", desc: "Visualize results instantly", Icon: BarChart3 },
  { title: "Private & secure", desc: "Your data never leaves your account", Icon: Lock },
  { title: "Collaborate easily", desc: "Share results or notebooks with your team", Icon: Users },
];

export default function Features() {
  return (
    <section id="features" className="mx-auto max-w-7xl px-4 py-16 sm:py-24">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6 }}
        className="grid grid-cols-1 gap-6 sm:grid-cols-2"
      >
        {FEATURES.map(({ title, desc, Icon }, idx) => (
          <motion.div
            key={title}
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.05 * idx }}
            className="group relative overflow-hidden rounded-2xl p-[1px] bg-gradient-to-br from-blue-500/30 to-indigo-500/30 transition-all hover:-translate-y-1 hover:shadow-[0_0_30px_rgba(59,130,246,0.15)]"
          >
            <div className="relative rounded-[calc(theme(borderRadius.2xl)-1px)] border border-white/10 bg-white/5 p-6 shadow-sm backdrop-blur-md">
              {/* Soft gradient sheen */}
              <div className="pointer-events-none absolute inset-0 rounded-[inherit] bg-gradient-to-br from-indigo-400/10 to-transparent" />
              <div className="relative flex items-start gap-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-blue-500 to-indigo-500 text-white shadow-sm">
                  <Icon className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-base font-semibold text-neutral-100">{title}</h3>
                  <p className="mt-1 text-sm text-neutral-300">{desc}</p>
                </div>
              </div>
            </div>
          </motion.div>
        ))}
      </motion.div>
    </section>
  );
}
