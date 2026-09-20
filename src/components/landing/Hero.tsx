"use client";

import { useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import { motion, useReducedMotion, useScroll, useTransform } from "framer-motion";
import { Container } from "../layout";
import CinematicWarpBackground from "@/components/ui/CinematicWarpBackground";
import Hero3D from "@/components/ui/Hero3D";

export function Hero() {
  const sectionRef = useRef<HTMLElement>(null);
  const reducedMotion = useReducedMotion();
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start start", "end start"],
  });
  const imageY = useTransform(scrollYProgress, [0, 1], [0, 12]);

  return (
    <section ref={sectionRef} className="hero" aria-labelledby="hero-heading">
      <div className="hero-background">
        <CinematicWarpBackground
          vanishingPointX={0.65}
          vanishingPointY={0.5}
          speedMultiplier={0.5}
          streakCount={120}
        />
      </div>
      {/* 3D Object - only visible on larger screens, hidden on mobile for performance */}
      <div className="hero-3d">
        <Hero3D />
      </div>
      <Container>
        <div className="hero-stage">
          <div className="hero-glow" aria-hidden="true" />
          <div className="hero-content">
            <div className="hero-entrance hero-entrance-eyebrow">
              <p className="hero-eyebrow"><span aria-hidden="true" />FRESHERS · 2026</p>
            </div>
            <div className="hero-entrance hero-entrance-headline">
              <h1 id="hero-heading">
                <span className="hero-chapter">CHAPTER</span>{" "}<span className="hero-one">ONE</span>
              </h1>
            </div>
            <div className="hero-entrance hero-entrance-copy">
              <p className="hero-copy">
                New faces. Late evenings. A campus full of possibility.
                Your first page starts here. Make it worth remembering.
              </p>
            </div>
            <div className="hero-entrance hero-entrance-actions">
              <div className="hero-actions">
                <Link className="hero-button hero-primary" href="/events">
                  EXPLORE EVENTS
                </Link>
                <Link className="hero-button hero-ghost" href="/hidden-trail">
                  WHAT IS HIDDEN TRAIL?
                </Link>
              </div>
            </div>
          </div>
          <div className="hero-visual">
            <div className="hero-frame">
              <motion.div
                className="hero-image"
                style={{ y: reducedMotion ? 0 : imageY }}
                initial={{ opacity: reducedMotion ? 1 : 0.25 }}
                animate={{ opacity: 1 }}
                transition={{ duration: reducedMotion ? 0 : 0.9 }}
              >
                <Image
                  src="/images/hero.jpg"
                  alt="Abstract golden bokeh lights on a dark evening backdrop"
                  fill
                  loading="eager"
                  fetchPriority="high"
                  sizes="(min-width:1024px) 55vw, 100vw"
                  style={{ objectFit: "cover" }}
                />
              </motion.div>
              <div className="hero-overlay" aria-hidden="true" />
            </div>
            <p className="hero-chip hero-date">OPENING NIGHT — SOON</p>
            <p className="hero-chip hero-location">ON CAMPUS</p>
          </div>
          <div className="hero-index" aria-hidden="true"><span>01</span></div>
        </div>
        <div className="hero-bottom">
          <a href="#chapter" className="hero-scroll">
            <span className="hero-scroll-line" aria-hidden="true" />
            TURN THE PAGE
          </a>
        </div>
      </Container>
      <span id="top" aria-hidden="true" />
      <style jsx>{`
        .hero {
          position: relative;
          isolation: isolate;
          overflow: clip;
          background: var(--bg);
          color: var(--text);
        }
        .hero-background {
          position: absolute;
          inset: 0;
          pointer-events: none;
        }
        .hero-3d {
          position: absolute;
          inset: 0;
          pointer-events: none;
          z-index: 1;
        }

        @media (max-width: 767px) {
          .hero-3d { display: none; }
        }
        .hero-stage {
          position: relative;
          display: grid;
          grid-template-columns: minmax(0, 1fr);
        }
        .hero-content {
          position: relative;
          z-index: 3;
          min-width: 0;
          padding-block: clamp(2.75rem, 9vw, var(--space-8)) var(--space-6);
        }
        .hero-entrance {
          opacity: 1;
          animation: hero-enter 600ms var(--ease) both;
        }
        .hero-entrance-eyebrow { animation-delay: 0ms; }
        .hero-entrance-headline { animation-delay: 80ms; }
        .hero-entrance-copy { animation-delay: 160ms; }
        .hero-entrance-actions { animation-delay: 240ms; }
        @keyframes hero-enter {
          from { opacity: 0.75; transform: translateY(32px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .hero-eyebrow {
          display: flex;
          align-items: center;
          gap: var(--space-3);
          margin-bottom: var(--space-5);
          color: var(--accent);
          font-family: var(--font-ui);
          font-size: var(--text-label);
          letter-spacing: 0.12em;
        }
        .hero-eyebrow span {
          width: var(--space-4);
          height: 1px;
          background: var(--accent);
        }
        h1 {
          margin: 0;
          font-size: var(--text-display);
          line-height: 0.98;
          letter-spacing: -0.04em;
        }
        .hero-chapter, .hero-one { display: block; }
        .hero-chapter { font-family: var(--font-display); font-weight: 500; }
        .hero-one {
          margin-top: var(--space-2);
          font-family: var(--font-ui);
          font-weight: 700;
          color: var(--accent);
          letter-spacing: -0.06em;
        }
        @supports (-webkit-text-stroke: 1px var(--accent)) {
          .hero-one {
            color: var(--transparent);
            -webkit-text-stroke: 1px var(--accent);
          }
        }
        .hero-copy {
          max-width: 48ch;
          margin-top: var(--space-5);
          color: var(--muted);
          font-size: var(--text-body);
          line-height: 1.7;
        }
        .hero-actions {
          display: flex;
          flex-wrap: wrap;
          align-items: center;
          gap: var(--space-3);
          margin-top: var(--space-6);
        }
        :global(.hero-button) {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          min-height: 44px;
          max-width: 100%;
          padding: var(--space-3) var(--space-5);
          border: 1px solid var(--transparent);
          border-radius: var(--radius-btn);
          font-family: var(--font-ui);
          font-size: var(--text-label);
          font-weight: 600;
          letter-spacing: 0.04em;
          text-align: center;
          transition: background var(--dur-fast) var(--ease), color var(--dur-fast) var(--ease), border-color var(--dur-fast) var(--ease);
        }
        :global(.hero-primary) { background: var(--accent); color: var(--bg); }
        :global(.hero-primary):hover { background: var(--accent-dim); color: var(--accent); border-color: var(--border-accent); }
        :global(.hero-ghost) { color: var(--muted); background: var(--transparent); }
        :global(.hero-ghost):hover { color: var(--text); background: var(--accent-dim); }
        :global(.hero-button):focus-visible, .hero-scroll:focus-visible {
          outline: 2px solid var(--accent);
          outline-offset: var(--space-1);
        }
        .hero-visual {
          position: relative;
          z-index: 1;
          min-width: 0;
          height: clamp(270px, 40svh, 430px);
        }
        .hero-frame { position: absolute; inset: 0; overflow: hidden; clip-path: inset(0); }
        .hero-frame :global(.hero-image) { position: absolute; inset: -12px 0; }
        .hero-overlay {
          position: absolute;
          inset: 0;
          pointer-events: none;
          background: linear-gradient(90deg, var(--bg), var(--transparent) 45%), linear-gradient(0deg, var(--bg), var(--transparent) 45%), linear-gradient(180deg, var(--bg), var(--transparent) 25%);
        }
        .hero-glow {
          position: absolute;
          z-index: 0;
          width: 70%;
          aspect-ratio: 1;
          right: 0;
          bottom: 0;
          border-radius: var(--radius-full);
          background: radial-gradient(circle at 30% 20%, var(--accent-dim), var(--transparent) 70%);
          pointer-events: none;
        }
        .hero-chip {
          position: absolute;
          z-index: 2;
          max-width: 88%;
          padding: var(--space-2) var(--space-3);
          border: 1px solid var(--border-accent);
          border-radius: var(--radius-full);
          background: var(--modal-backdrop);
          color: var(--accent);
          font-family: var(--font-ui);
          font-size: var(--text-meta);
          letter-spacing: 0.08em;
        }
        .hero-date { top: 8%; left: 6%; }
        .hero-location { display: none; right: 6%; bottom: 12%; color: var(--text); }
        .hero-index { display: none; }
        .hero-bottom {
          display: flex;
          justify-content: center;
          border-top: 1px solid var(--border);
          padding-block: var(--space-5);
        }

        @media (max-width: 639px) {
          .hero-content { padding-top: 2.5rem; }
          .hero-copy { max-width: 36ch; font-size: .96rem; }
          .hero-actions { align-items: stretch; }
          :global(.hero-button) {
            min-height: 48px;
            width: 100%;
          }
          .hero-date { top: 7%; left: 5%; }
          .hero-bottom { padding-block: 1rem; }
        }
        .hero-scroll {
          display: inline-flex;
          align-items: center;
          gap: var(--space-3);
          min-height: 44px;
          color: var(--muted);
          font-size: var(--text-meta);
          letter-spacing: 0.12em;
        }
        .hero-scroll:hover { color: var(--accent); }
        .hero-scroll-line {
          width: 1px;
          height: var(--space-6);
          background: var(--accent);
          transform-origin: top;
          animation: hero-scroll-pulse calc(var(--dur-slow) * 3) var(--ease) infinite;
        }
        @keyframes hero-scroll-pulse {
          0%, 100% { transform: scaleY(0.5); opacity: 0.4; }
          50% { transform: scaleY(1); opacity: 1; }
        }
        @media (min-width: 1024px) {
          .hero { min-height: clamp(640px, 92svh, 900px); display: flex; }
          .hero :global(.container-c1) { display: flex; flex-direction: column; }
          .hero-stage { flex: 1; grid-template-columns: repeat(12, minmax(0, 1fr)); }
          .hero-content { grid-column: 1 / 8; grid-row: 1; align-self: center; padding-block: var(--space-9); }
          .hero-visual { grid-column: 6 / -1; grid-row: 1; height: auto; align-self: stretch; margin-block: var(--space-7); }
          .hero-date { left: 22%; }
          .hero-location { display: block; }
          .hero-glow { width: 65%; top: 5%; bottom: auto; }
          .hero-index {
            position: absolute;
            z-index: 2;
            top: 67%;
            left: 60%;
            width: 36%;
            display: flex;
            align-items: center;
            gap: var(--space-3);
            color: var(--accent);
            font-size: var(--text-meta);
            letter-spacing: 0.12em;
          }
          .hero-index::after { content: ""; height: 1px; flex: 1; background: var(--border-accent); }
        }
        @media (prefers-reduced-motion: reduce) {
          .hero-entrance, .hero-scroll-line { animation: none; }
          :global(.hero-button), .hero-scroll { transition: none; }
          .hero-content :global([style]), .hero-frame :global(.hero-image) { transform: none !important; opacity: 1 !important; }
        }
      `}</style>
    </section>
  );
}