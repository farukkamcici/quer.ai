import Link from "next/link";

// Footer: minimal with softer hover and updated copyright
export default function Footer() {
  return (
    <footer className="border-t border-white/10 bg-[#0b1529]">
      <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-6 px-4 py-8 sm:flex-row">
        <div className="flex items-center gap-2">
          <span className="inline-block h-2.5 w-2.5 rounded-full bg-blue-500" />
          <span className="text-sm font-semibold text-neutral-100">Querai</span>
        </div>
        <nav className="flex items-center gap-4 text-sm text-neutral-300">
          <Link href="#" className="transition-colors hover:opacity-80">
            Product
          </Link>
          <Link href="#" className="transition-colors hover:opacity-80">
            Docs
          </Link>
          <Link href="#" className="transition-colors hover:opacity-80">
            Pricing
          </Link>
          <Link href="#" className="transition-colors hover:opacity-80">
            Contact
          </Link>
          <Link href="/?auth=login" className="transition-colors hover:opacity-80">
            Sign in
          </Link>
        </nav>
        <div className="text-xs text-neutral-400">© 2025 Querai. All rights reserved.</div>
      </div>
    </footer>
  );
}
