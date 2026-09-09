"use client";

import Link from "next/link";
import { ArrowRight, ArrowDown } from "lucide-react";
import { LandingNavbar } from "./LandingNavbar";

export function HeroSection() {
  return (
    <div className="relative w-full min-h-screen flex flex-col justify-between overflow-hidden bg-[#eef1ed] select-none">
      {/* 1. Panoramic Background Animated Video & Mist Overlays */}
      <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden">
        <video
          autoPlay
          loop
          muted
          playsInline
          poster="/images/himalayan-border-hero-poster.jpg"
          className="w-full h-full object-cover object-[70%_45%]"
        >
          <source src="/videos/himalayan-border-animated.mp4" type="video/mp4" />
        </video>

        {/* Soft top gradient to ensure navbar clarity */}
        <div className="absolute top-0 inset-x-0 h-44 bg-gradient-to-b from-white/95 via-white/50 to-transparent" />

        {/* Left atmospheric mist gradient: ensures 100% crisp readability for headline & text */}
        <div className="absolute inset-y-0 left-0 w-full sm:w-2/3 lg:w-[55%] bg-gradient-to-r from-white/95 via-white/75 to-transparent" />

        {/* Dreamy misty white fog fading into the bottom */}
        <div className="absolute bottom-0 inset-x-0 h-72 bg-gradient-to-t from-white via-white/85 to-transparent" />
      </div>

      {/* 2. Top Navigation Bar */}
      <div className="relative z-20">
        <LandingNavbar />
      </div>

      {/* 3. Main Hero Content Area */}
      <main className="relative z-10 w-full max-w-7xl mx-auto px-6 sm:px-10 lg:px-16 py-8 md:py-12 flex-1 flex flex-col justify-center">
        <div className="max-w-2xl space-y-6">
          <h1 className="text-5xl sm:text-6xl md:text-7xl lg:text-[76px] font-extrabold tracking-tight text-slate-950 leading-[1.02]">
            Safer <br />
            Borders <br />
            <span className="text-[#1a4a32]">Stronger India</span>
          </h1>

          <p className="text-base sm:text-lg md:text-xl text-slate-800 font-medium leading-relaxed max-w-lg">
            Real-time surveillance for a secure and peaceful tomorrow.
          </p>

          <div className="pt-2">
            <Link
              href="/dashboard"
              className="inline-flex items-center gap-3 px-8 py-3.5 rounded-full bg-[#1b3a2a] hover:bg-[#12281c] text-white text-base font-semibold tracking-wide shadow-lg shadow-emerald-950/20 hover:shadow-xl hover:scale-[1.02] active:scale-[0.98] transition-all duration-200"
            >
              <span>View Live Map</span>
              <ArrowRight className="w-4 h-4 text-emerald-300" />
            </Link>
          </div>
        </div>
      </main>

      {/* 4. Bottom Footer Metadata & Controls */}
      <footer className="relative z-20 w-full max-w-7xl mx-auto px-6 sm:px-10 lg:px-16 pb-8 pt-4 flex flex-col sm:flex-row items-start sm:items-end justify-between gap-6">
        {/* Bottom Left Meta & Scroll prompt */}
        <div className="space-y-3">
          <div className="flex items-center gap-3 text-xs font-bold tracking-[0.2em] text-slate-800 uppercase">
            <span className="w-6 h-[2px] bg-slate-800" />
            <span>OUR LAND</span>
            <span>OUR PEOPLE</span>
            <span>OUR RESPONSIBILITY</span>
          </div>

          <div className="flex items-center gap-2 text-xs font-semibold text-slate-800 hover:text-slate-950 transition-colors cursor-pointer">
            <ArrowDown className="w-3.5 h-3.5 text-slate-800 animate-bounce" />
            <span>Scroll to explore</span>
          </div>
        </div>

        {/* Bottom Right Carousel & Pillars */}
        <div className="flex items-center gap-8">
          {/* Slider Indicator */}
          <div className="flex items-center gap-2 text-xs font-mono font-bold text-slate-900">
            <span>01</span>
            <span className="w-8 h-[2px] bg-slate-900" />
            <span className="text-slate-400">03</span>
          </div>

          {/* Right Stacked Pillars */}
          <div className="border-l-2 border-slate-400/80 pl-4 flex flex-col text-[10px] font-bold tracking-[0.2em] text-slate-800 uppercase leading-relaxed">
            <span>TECHNOLOGY</span>
            <span>PEOPLE</span>
            <span className="text-slate-950 font-extrabold">A SAFER TOMORROW</span>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default HeroSection;
