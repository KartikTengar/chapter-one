"use client";

import { useRouter } from "next/navigation";
import { motion } from "framer-motion";

export function TrailPreview() {
  const router = useRouter();

  return (
    <section id="hidden-trail" className="hidden-trail" aria-labelledby="trail-heading">
      <div className="container-c1">
        <div className="hidden-trail-background" />
        <div className="hidden-trail-content">
          <motion.h2
            className="hidden-trail-eyebrow"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: "easeOut" }}
          >
            <span aria-hidden="true" />THE HIDDEN TRAIL
          </motion.h2>
          <h1 id="trail-heading" className="hidden-trail-title">
            10 markers. One path. Find your way.
          </h1>
          <motion.p
            className="hidden-trail-description"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.2, ease: "easeOut" }}
          >
            Scan the unknown. Solve what waits beneath the surface. Climb the leaderboard.
          </motion.p>
          <div className="hidden-trail-cta">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="hidden-trail-enter"
              onClick={() => router.push("/hidden-trail")}
            >
              ENTER THE TRAIL
            </motion.button>
          </div>
        </div>
      </div>
      <span aria-hidden="true" />
      <style jsx>{`
        .hidden-trail {
          position: relative;
          isolation: isolate;
          overflow: clip;
          background: var(--bg);
          color: var(--text);
        }
        .hidden-trail-background {
          position: absolute;
          inset: 0;
          pointer-events: none;
          background: 
            radial-gradient(ellipse at 20% 20%, color-mix(in srgb, var(--accent) 5%, var(--transparent)) 0%, var(--transparent) 50%),
            radial-gradient(ellipse at 80% 80%, color-mix(in srgb, var(--accent) 3%, var(--transparent)) 0%, var(--transparent) 50%),
            var(--bg);
        }
        .hidden-trail-content {
          position: relative;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: var(--space-6);
        }
        .hidden-trail-eyebrow {
          color: var(--accent);
          font-family: var(--font-ui);
          font-size: var(--text-label);
          letter-spacing: 0.16em;
          text-transform: uppercase;
          opacity: 1;
          animation: none;
        }
        .hidden-trail-title {
          margin: 0;
          font-family: var(--font-display);
          font-size: clamp(3rem, 2.5rem + 3vw, 5rem);
          font-weight: 500;
          line-height: 1.1;
          letter-spacing: -0.04em;
          color: var(--text);
          text-align: center;
          margin-bottom: var(--space-3);
        }
        .hidden-trail-description {
          max-width: 48ch;
          margin: 0;
          color: var(--muted);
          font-size: var(--text-body);
          line-height: 1.7;
          text-align: center;
        }
        .hidden-trail-cta {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: var(--space-3);
        }
        .hidden-trail-enter {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          min-height: 52px;
          padding: var(--space-3) var(--space-6);
          background: var(--accent);
          color: var(--bg);
          font-family: var(--font-ui);
          font-size: var(--text-label);
          font-weight: 600;
          letter-spacing: 0.04em;
          text-transform: uppercase;
          border: none;
          border-radius: var(--radius-btn);
          cursor: pointer;
          transition: transform var(--dur-fast) var(--ease), box-shadow var(--dur-fast) var(--ease);
          z-index: 2;
        }
        .hidden-trail-enter:hover {
          transform: translateY(-2px);
          box-shadow: var(--shadow-elevated);
        }
        .hidden-trail-enter:focus-visible {
          outline: 2px solid var(--accent);
          outline-offset: var(--space-1);
        }
        @media (min-width: 768px) {
          .hidden-trail { padding-block: var(--space-9); }
        }
        @media (prefers-reduced-motion: reduce) {
          .hidden-trail-enter {
            transition: none;
            box-shadow: none;
          }
          .hidden-trail-enter:hover {
            transform: none;
          }
        }
      `}</style>
    </section>
  );
}

export default TrailPreview;