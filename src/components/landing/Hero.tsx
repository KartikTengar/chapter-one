"use client";

import { useReducedMotion } from "framer-motion";
import { FloatingCard } from "./FloatingCard";
import { ScrollIndicator } from "./ScrollIndicator";

export function Hero() {
  const reducedMotion = useReducedMotion();

  return (
    <section
      className="hero-section"
      aria-label="Hero section"
    >
      <div className="max-container">
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-[0.95fr_1.05fr] lg:gap-12 xl:gap-16">
          {/* ── LEFT: Copy column ── */}
          <div className="flex flex-col justify-center gap-6 py-8 lg:py-0">
            <p className="eyebrow-text text-[var(--accent)] uppercase border-b border-white/[0.06] pb-2 w-fit">
              FRESHERS 2026
            </p>

            <h1 className="text-[var(--foreground)] text-[clamp(2.75rem,8vw,3.6rem)] font-black leading-[0.95] uppercase tracking-tight max-w-lg lg:text-[clamp(4.5rem,7vw,7rem)]">
              <span className="block">YOUR FIRST</span>
              <span className="block">CHAPTER</span>
              <span className="block">STARTS HERE</span>
            </h1>

            <p className="supporting-text text-[var(--muted)] max-w-md">
              A new campus. New people. New memories. One unforgettable beginning.
            </p>

            <div className="mt-2 flex flex-wrap gap-4 items-center">
              <a
                href="#attend"
                className="rounded-full px-8 py-4 bg-[var(--accent)] text-[var(--background)] font-bold text-base transition-all hover:bg-opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] focus-visible:ring-offset-2"
                aria-label="Attend the event"
              >
                ENTER THE EXPERIENCE
              </a>
              <a
                href="#gallery"
                className="rounded-full px-8 py-4 bg-transparent border border-white/[0.12] text-[var(--foreground)] font-medium text-base transition-colors hover:bg-white/[0.04] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] focus-visible:ring-offset-2"
                aria-label="View gallery"
              >
                VIEW GALLERY
              </a>
            </div>
          </div>

          {/* ── RIGHT: Image column ── */}
          <div className="order-1 lg:order-2">
            <div className="relative">
              <div className="relative rounded-[28px] overflow-hidden">
                <img
                  src="/images/hero.jpg"
                  alt="Freshers 2026 — college event atmosphere with students and warm cinematic lighting"
                  className="w-full aspect-[4/5] object-cover object-center"
                  loading="eager"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[var(--background)]/40 via-transparent to-transparent rounded-[28px]" />
              </div>

              {/* Desktop cards — absolutely positioned inside image wrapper */}
              <div className="hidden lg:block">
                <div className="absolute -left-8 top-[12%]">
                  <FloatingCard variant="date" position="top-left" />
                </div>
                <div className="absolute -right-6 top-[6%]">
                  <FloatingCard variant="students" position="top-right" />
                </div>
                <div className="absolute -left-6 bottom-[14%]">
                  <FloatingCard variant="location" position="bottom-left" />
                </div>
              </div>

              {/* Mobile cards — normal flow below image */}
              <div className="block lg:hidden mt-6">
                <div className="grid grid-cols-2 gap-4">
                  <FloatingCard variant="date" position="top-left" />
                  <FloatingCard variant="students" position="top-right" />
                </div>
                <div className="mt-4">
                  <FloatingCard variant="location" position="bottom-left" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {!reducedMotion && <ScrollIndicator />}
    </section>
  );
}