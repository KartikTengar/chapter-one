import "server-only";
import Image from "next/image";
import Link from "next/link";
import css from "styled-jsx/css";
import { Container, Section } from "@/components/layout";

const experiences = [
  { number: "01", title: "EVENTS", href: "/events", description: "Big nights. First memories. Your campus, together.", image: true },
  { number: "02", title: "HIDDEN TRAIL", href: "/hidden-trail", description: "Follow the clues. Find a different side of campus.", image: true },
  { number: "03", title: "ACTIVITIES", description: "Try something new, just because you can.", image: false },
  { number: "04", title: "COMPETITIONS", description: "Bring your edge. Meet your match.", image: false },
  { number: "05", title: "SOCIALS", description: "Strangers today. Your people tomorrow.", image: false },
];

const styles = css.global`
  .experiences-section {
    color: var(--text);
    font-family: var(--font-ui);
  }
  .experiences-section .experiences-header {
    margin-bottom: var(--space-6);
  }
  .experiences-section .experiences-label {
    margin: 0 0 var(--space-3);
    color: var(--accent);
    font-size: var(--text-label);
    letter-spacing: 0.14em;
  }
  .experiences-section h2 {
    margin: 0;
    font-family: var(--font-display);
    font-size: var(--text-h2);
    font-weight: 400;
    line-height: 1.2;
  }
  .experiences-section .experiences-grid {
    display: grid;
    grid-template-columns: minmax(0, 1fr);
    gap: var(--space-4);
    margin: 0;
    padding: 0;
    list-style: none;
  }
  .experiences-section .experience-item {
    min-width: 0;
  }
  .experiences-section .experience-tile {
    position: relative;
    isolation: isolate;
    overflow: hidden;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    gap: var(--space-7);
    height: 100%;
    min-height: calc(var(--space-10) * 2);
    padding: var(--space-6);
    border: 1px solid var(--border);
    background: var(--surface);
    color: var(--text);
    text-decoration: none;
    transition:
      border-color var(--dur-normal) var(--ease),
      background var(--dur-normal) var(--ease);
  }
  .experiences-section .experience-image {
    position: absolute;
    inset: 0;
    z-index: -2;
    opacity: 0.18;
  }
  .experiences-section .experience-image img {
    object-fit: cover;
    object-position: 30% 35%;
  }
  .experiences-section .experience-02 .experience-image img {
    object-position: 80% 75%;
  }
  .experiences-section .experience-image::after {
    content: "";
    position: absolute;
    inset: 0;
    background: linear-gradient(160deg, var(--transparent), var(--surface));
  }
  .experiences-section .experience-meta {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: var(--space-4);
    color: var(--muted);
    font-size: var(--text-meta);
    font-variant-numeric: tabular-nums;
    letter-spacing: 0.08em;
  }
  .experiences-section .experience-arrow {
    display: inline-block;
    color: var(--accent);
    font-size: var(--text-h3);
    font-weight: 400;
    transition: transform var(--dur-fast) var(--ease);
  }
  .experiences-section .experience-title {
    margin: 0 0 var(--space-3);
    font-family: var(--font-display);
    font-size: var(--text-h2);
    font-weight: 400;
    line-height: 1.15;
    overflow-wrap: anywhere;
  }
  .experiences-section .experience-description {
    margin: 0;
    color: var(--muted);
    font-size: var(--text-label);
    line-height: 1.6;
  }
  .experiences-section a.experience-tile:hover,
  .experiences-section a.experience-tile:focus-visible {
    border-color: var(--accent);
    background: var(--surface-2);
  }
  .experiences-section a.experience-tile:hover .experience-arrow,
  .experiences-section a.experience-tile:focus-visible .experience-arrow {
    transform: translateX(var(--space-1));
  }
  .experiences-section a.experience-tile:focus-visible {
    outline: 2px solid var(--accent);
    outline-offset: var(--space-1);
  }
  @media (min-width: 1024px) {
    .experiences-section .experiences-grid {
      grid-template-columns: repeat(3, minmax(0, 1fr));
    }
    .experiences-section .experience-01 {
      grid-column: 1 / 3;
      grid-row: 1;
    }
    .experiences-section .experience-02 {
      grid-column: 3;
      grid-row: 1 / 3;
    }
    .experiences-section .experience-03 {
      grid-column: 1;
      grid-row: 2;
    }
    .experiences-section .experience-04 {
      grid-column: 2;
      grid-row: 2;
    }
    .experiences-section .experience-05 {
      grid-column: 1 / 4;
      grid-row: 3;
    }
    .experiences-section .experience-01 .experience-title {
      font-size: var(--text-h1);
    }
    .experiences-section .experience-05 .experience-tile {
      min-height: 0;
      flex-direction: row;
      align-items: center;
    }
    .experiences-section .experience-05 .experience-meta {
      flex: 1;
    }
    .experiences-section .experience-05 .experience-copy {
      flex: 2;
    }
  }
  @media (prefers-reduced-motion: reduce) {
    .experiences-section .experience-tile,
    .experiences-section .experience-arrow {
      transition: none;
    }
    .experiences-section a.experience-tile:hover .experience-arrow,
    .experiences-section a.experience-tile:focus-visible .experience-arrow {
      transform: none;
    }
  }
`;

export function ExperiencesGrid() {
  return (
    <Section id="experiences" className="experiences-section" aria-labelledby="experiences-heading">
      <Container>
        <header className="experiences-header">
          <p className="experiences-label">EXPERIENCES</p>
          <h2 id="experiences-heading">More than orientation.</h2>
        </header>
        <ol className="experiences-grid">
          {experiences.map((experience) => {
            const content = (
              <>
                {experience.image && (
                  <div className="experience-image" aria-hidden="true">
                    <Image
                      src="/images/hero.jpg"
                      alt=""
                      fill
                      sizes={experience.number === "01" ? "(min-width: 1024px) 66vw, 100vw" : "(min-width: 1024px) 33vw, 100vw"}
                      loading="lazy"
                    />
                  </div>
                )}
                <div className="experience-meta">
                  <span>{experience.number}</span>
                  {experience.href ? (
                    <span className="experience-arrow" aria-hidden="true">→</span>
                  ) : (
                    <span>Coming soon</span>
                  )}
                </div>
                <div className="experience-copy">
                  <h3 className="experience-title">{experience.title}</h3>
                  <p className="experience-description">{experience.description}</p>
                </div>
              </>
            );

            return (
              <li key={experience.number} className={`experience-item experience-${experience.number}`}>
                {experience.href ? (
                  <Link href={experience.href} className="experience-tile">{content}</Link>
                ) : (
                  <div className="experience-tile">{content}</div>
                )}
              </li>
            );
          })}
        </ol>
      </Container>
      <style>{String(styles)}</style>
    </Section>
  );
}

export default ExperiencesGrid;
