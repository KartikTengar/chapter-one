import Image from "next/image";
import { Button } from "@/components/ui/Button";
import { LandingStyles } from "./Countdown";

export function FinalCTA() {
  return (
    <section className="final-cta" aria-labelledby="final-cta-heading">
      <Image src="/images/hero.jpg" alt="" fill loading="lazy" sizes="100vw" className="final-cta-image" />
      <div className="final-cta-overlay" aria-hidden="true" />
      <div className="container-c1 final-cta-content">
        <p className="final-cta-eyebrow">EPILOGUE</p>
        <h2 id="final-cta-heading">YOUR FIRST CHAPTER STARTS NOW.</h2>
        <div className="final-cta-actions">
          <form action="/events" method="get">
            <Button variant="primary" type="submit">EXPLORE EVENTS</Button>
          </form>
          <form action="/signup" method="get">
            <Button variant="secondary" type="submit">ENTER CHAPTER ONE</Button>
          </form>
        </div>
      </div>
      <LandingStyles id="landing-final-cta">{`
        .final-cta { position: relative; isolation: isolate; display: grid; align-items: center; overflow: hidden; padding-block: var(--space-9); background: var(--bg); }
        .final-cta .final-cta-image { object-fit: cover; object-position: center; z-index: -2; }
        .final-cta-overlay { position: absolute; inset: 0; z-index: -1; pointer-events: none; background: radial-gradient(ellipse at 50% 65%, color-mix(in srgb, var(--accent) 6%, var(--transparent)), var(--transparent) 65%), color-mix(in srgb, var(--bg) 85%, var(--transparent)); }
        .final-cta-content { display: flex; flex-direction: column; align-items: center; gap: var(--space-6); text-align: center; }
        .final-cta-eyebrow { color: var(--accent); font-size: var(--text-label); letter-spacing: 0.16em; }
        #final-cta-heading { max-width: 16ch; font-family: var(--font-display); font-size: var(--text-display); font-weight: 500; letter-spacing: -0.02em; line-height: 1.05; color: var(--text); }
        .final-cta-actions { display: flex; flex-wrap: wrap; justify-content: center; gap: var(--space-4); margin-top: var(--space-5); }
        .final-cta-actions form { margin: 0; }
        @media (min-width: 768px) { .final-cta { min-height: 70vh; padding-block: var(--space-10); } }
      `}</LandingStyles>
    </section>
  );
}

export default FinalCTA;
