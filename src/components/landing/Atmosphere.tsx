import Image from "next/image";
import { LandingStyles } from "./Countdown";

const frames = [
  { id: 1, sizes: "(max-width: 767px) 50vw, (max-width: 1440px) 25vw, 350px" },
  { id: 2, sizes: "(max-width: 767px) 50vw, (max-width: 1440px) 33vw, 467px" },
  { id: 3, sizes: "(max-width: 767px) 50vw, (max-width: 1440px) 42vw, 584px" },
  { id: 4, sizes: "(max-width: 767px) 50vw, (max-width: 1440px) 42vw, 584px" },
  { id: 5, sizes: "(max-width: 767px) 50vw, (max-width: 1440px) 33vw, 467px" },
];

export function Atmosphere() {
  return (
    <section className="atmosphere" aria-labelledby="atmosphere-heading" aria-describedby="atmosphere-note">
      <div className="container-c1">
        <header className="atmosphere-header">
          <h2 id="atmosphere-heading">The mood, before the memories</h2>
          <p id="atmosphere-note">Atmosphere study · Campus photography coming soon</p>
        </header>
        <div className="atmosphere-grid" aria-hidden="true">
          {frames.map((frame) => (
            <div className={`atmosphere-frame atmosphere-frame-${frame.id}`} key={frame.id}>
              <Image src="/images/hero.jpg" alt="" fill loading="lazy" sizes={frame.sizes} />
            </div>
          ))}
        </div>
      </div>
      <LandingStyles id="landing-atmosphere">{`
        .atmosphere { position: relative; isolation: isolate; overflow: clip; padding-block: var(--space-7); }
        .atmosphere::before { content: ""; position: absolute; inset: 0; z-index: -1; pointer-events: none; background: radial-gradient(ellipse at 45% 50%, color-mix(in srgb, var(--accent) 5%, var(--transparent)), var(--transparent) 65%); }
        .atmosphere-header { margin-bottom: var(--space-6); }
        .atmosphere-header h2 { margin: 0; font-family: var(--font-display); font-size: var(--text-h2); font-weight: 400; line-height: 1.2; }
        .atmosphere-header p { margin: var(--space-3) 0 0; font-family: var(--font-ui); font-size: var(--text-label); color: var(--muted); }
        .atmosphere-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: var(--space-3); align-items: start; }
        .atmosphere-frame { position: relative; min-width: 0; margin: 0; aspect-ratio: 4 / 5; overflow: hidden; border: 1px solid var(--border); border-radius: var(--radius-card); background: var(--surface); }
        .atmosphere-frame img { object-fit: cover; }
        .atmosphere-frame-1 img { object-position: 15% 35%; transform: scale(1.15); }
        .atmosphere-frame-2 img { object-position: 70% 20%; transform: scale(1.35); }
        .atmosphere-frame-3 img { object-position: 50% 60%; }
        .atmosphere-frame-4 img { object-position: 25% 80%; transform: scale(1.25); }
        .atmosphere-frame-5 img { object-position: 85% 45%; transform: scale(1.5); }
        .atmosphere-frame-5 { aspect-ratio: 5 / 4; }
        @media (min-width: 768px) {
          .atmosphere { padding-block: var(--space-9); }
          .atmosphere-grid { grid-template-columns: repeat(12, minmax(0, 1fr)); gap: var(--space-5); padding-block: var(--space-6); }
          .atmosphere-frame-1 { grid-column: span 3; aspect-ratio: 3 / 4; margin-top: var(--space-7); }
          .atmosphere-frame-2 { grid-column: span 4; aspect-ratio: 4 / 5; margin-top: calc(-1 * var(--space-5)); }
          .atmosphere-frame-3 { grid-column: span 5; aspect-ratio: 5 / 4; margin-top: var(--space-8); }
          .atmosphere-frame-4 { grid-column: 2 / span 5; aspect-ratio: 5 / 3; margin-top: calc(-1 * var(--space-4)); }
          .atmosphere-frame-5 { grid-column: 8 / span 4; aspect-ratio: 4 / 3; margin-top: var(--space-6); }
        }
      `}</LandingStyles>
    </section>
  );
}

export default Atmosphere;
