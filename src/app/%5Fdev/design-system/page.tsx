import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Container, Section } from "@/components/layout";
import Showcase from "./Showcase";
import styles from "./Showcase.module.scss";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Design System — internal",
  robots: { index: false, follow: false },
};

const colors = [
  "bg", "surface", "surface-2", "text", "muted", "accent", "accent-dim",
  "success", "warning", "error", "border", "border-control", "border-accent",
];

const typography = [
  ["display", "Display — A new chapter begins"],
  ["h1", "Heading 1 sample"],
  ["h2", "Heading 2 sample"],
  ["h3", "Heading 3 sample"],
  ["body", "Body — Your college journey starts here."],
  ["label", "Label text"],
  ["meta", "Metadata text"],
];

export default function DesignSystemPage() {
  if (process.env.NODE_ENV !== "development") notFound();

  return (
    <main className={styles.page}>
      <Container>
        <header className={styles.stack}>
          <h1>CHAPTER ONE — Design System</h1>
          <p className={styles.muted}>Phase 1 · Development-only primitive and token reference</p>
        </header>
        <Section aria-labelledby="colors-title">
          <h2 id="colors-title" className={styles.sectionTitle}>Colors</h2>
          <ul className={styles.swatches}>
            {colors.map((token) => (
              <li key={token} className={styles.stack}>
                <span
                  className={styles.swatch}
                  style={{ background: `var(--${token})` }}
                  aria-hidden="true"
                />
                <code>--{token}</code>
              </li>
            ))}
          </ul>
        </Section>
        <Section aria-labelledby="typography-title">
          <h2 id="typography-title" className={styles.sectionTitle}>Typography</h2>
          <div className={styles.stack}>
            {typography.map(([token, text]) => (
              <div key={token}>
                <code className={styles.muted}>--text-{token}</code>
                <p
                  className={styles.typeSample}
                  style={{
                    fontSize: `var(--text-${token})`,
                    fontFamily: token === "display" || token.startsWith("h")
                      ? "var(--font-display)" : "var(--font-ui)",
                  }}
                >
                  {text}
                </p>
              </div>
            ))}
          </div>
        </Section>
        <Section aria-labelledby="primitives-title">
          <h2 id="primitives-title" className={styles.sectionTitle}>UI primitives</h2>
          <Showcase />
        </Section>
        <Section aria-labelledby="spacing-title">
          <h2 id="spacing-title" className={styles.sectionTitle}>Spacing scale</h2>
          <p className={styles.muted}>Bars show four times each token, capped at the available width.</p>
          <ul className={styles.spacing}>
            {Array.from({ length: 10 }, (_, index) => index + 1).map((step) => (
              <li key={step} className={styles.stack}>
                <code>--space-{step}</code>
                <span
                  className={styles.spacingBar}
                  style={{ width: `calc(var(--space-${step}) * 4)` }}
                  aria-hidden="true"
                />
              </li>
            ))}
          </ul>
        </Section>
      </Container>
    </main>
  );
}
