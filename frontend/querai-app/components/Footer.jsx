import Link from "next/link";

// Footer: minimal with softer hover and updated copyright
export default function Footer() {
  return (
    <footer className="border-t border-slate-200 bg-white">
      <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-6 px-4 py-8 sm:flex-row">
        <div className="flex items-center gap-2">
          <span className="inline-block h-2.5 w-2.5 rounded-full bg-blue-600" />
          <span className="text-sm font-semibold text-slate-900">Querai</span>
        </div>
        <nav className="flex items-center gap-4 text-sm text-slate-600">
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
        </nav>
        <div className="text-xs text-slate-500">© 2025 Querai. All rights reserved.</div>
      </div>
    </footer>
  );
}
