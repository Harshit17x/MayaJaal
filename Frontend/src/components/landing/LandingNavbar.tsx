import Link from "next/link";
import { Search, User } from "lucide-react";
import { EmblemIndia } from "./EmblemIndia";

export function LandingNavbar() {
  return (
    <header className="w-full z-30 pt-6 px-6 sm:px-10 lg:px-16 flex items-center justify-between">
      {/* Left Branding */}
      <div className="flex items-center gap-3.5">
        <EmblemIndia className="w-10 h-12" />
        <div className="flex flex-col">
          <span className="text-[11px] font-semibold text-slate-700 tracking-wide uppercase">
            Government of India
          </span>
          <span className="text-base sm:text-lg font-bold tracking-tight text-slate-950 leading-tight">
            Border Surveillance Portal
          </span>
          <span className="text-[10px] font-bold tracking-[0.22em] text-[#1b4332] uppercase mt-0.5">
            SECURE BORDERS • SAFER TOMORROW
          </span>
        </div>
      </div>

      {/* Center Navigation Links */}
      <nav className="hidden md:flex items-center gap-8">
        <Link
          href="/"
          className="relative text-sm font-bold text-slate-950 pb-1 after:absolute after:bottom-0 after:left-0 after:w-full after:h-[2px] after:bg-[#1e4933]"
        >
          Home
        </Link>
        <Link
          href="/live"
          className="text-sm font-semibold text-slate-700 hover:text-slate-950 transition-colors"
        >
          Live View
        </Link>
        <Link
          href="/dashboard"
          className="text-sm font-semibold text-slate-700 hover:text-slate-950 transition-colors"
        >
          Reports
        </Link>
        <Link
          href="/about"
          className="text-sm font-semibold text-slate-700 hover:text-slate-950 transition-colors"
        >
          About
        </Link>
      </nav>

      {/* Right Search & Login Button */}
      <div className="flex items-center gap-4">
        {/* Search Icon */}
        <button
          type="button"
          aria-label="Search"
          className="p-2 text-slate-700 hover:text-slate-950 transition-colors cursor-pointer"
        >
          <Search className="w-4 h-4" />
        </button>

        {/* Divider */}
        <div className="h-4 w-[1px] bg-slate-400 hidden sm:block" />

        {/* Login Button */}
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-[#172e22] hover:bg-[#0f1f17] text-white text-sm font-semibold shadow-sm transition-all"
        >
          <User className="w-4 h-4 text-white" />
          <span>Login</span>
        </Link>
      </div>
    </header>
  );
}

export default LandingNavbar;
