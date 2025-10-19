// Marketing landing page for Quer.ai
// - Uses Inter font locally to satisfy design spec
// - Composed of Hero, Features, Demo, and Footer sections

import { Plus_Jakarta_Sans } from "next/font/google";
import Hero from "@/components/Hero";
import Features from "@/components/Features";
import Footer from "@/components/Footer";

const plusJakarta = Plus_Jakarta_Sans({ subsets: ["latin"], display: "swap" });

export const metadata = {
  title: "Querai – Powerful analytics without the wait",
  description:
    "Ask questions in plain English, get instant visual insights. No SQL required.",
};

export default function MarketingPage() {
  return (
    <main className={`${plusJakarta.className} bg-[#FAFAFA]`}> {/* Modern minimal background */}
      <Hero />
      <Features />
      <Footer />
    </main>
  );
}
