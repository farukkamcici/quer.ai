"use client";
import { motion } from "framer-motion";

export function FadeIn({ children, delay = 0, y = 12 }) {
  return (
    <motion.div initial={{ opacity: 0, y }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.4, delay }}>
      {children}
    </motion.div>
  );
}

export function Stagger({ children, delay = 0, gap = 0.05 }) {
  const items = Array.isArray(children) ? children : [children];
  return (
    <>
      {items.map((c, i) => (
        <FadeIn key={i} delay={delay + i * gap}>{c}</FadeIn>
      ))}
    </>
  );
}

export function InViewSection({ children }) {
  return (
    <motion.section initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.6 }}>
      {children}
    </motion.section>
  );
}
