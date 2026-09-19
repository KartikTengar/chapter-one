export const ChapterEditorialStyles = (
  <style>{`
    .chapter-editorial {
      background: var(--bg);
      color: var(--text);
      position: relative;
      overflow: hidden;
      scroll-margin-top: var(--space-10);
    }
    .chapter-editorial-background {
      position: absolute;
      inset: 0;
      pointer-events: none;
      z-index: 0;
    }
    .chapter-editorial-background-content {
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      width: 100%;
      text-align: center;
      pointer-events: none;
    }
    .chapter-editorial-background-content h2 {
      font-family: var(--font-display);
      font-size: clamp(10rem, 25vw, 20rem);
      font-weight: 900;
      color: rgba(255, 255, 255, 0.03);
      letter-spacing: -0.05em;
      line-height: 0.9;
      margin: 0;
      white-space: nowrap;
    }
    .chapter-editorial-content {
      position: relative;
      z-index: 2;
      padding-block: var(--space-16) var(--space-12);
    }
    .chapter-editorial .chapter-quote {
      max-width: 40ch;
      margin: 0 0 var(--space-6) 0;
      font-family: var(--font-display);
      font-size: var(--text-display);
      font-weight: 500;
      line-height: 1.08;
      letter-spacing: -0.04em;
    }
    .chapter-editorial .chapter-period { color: var(--accent); }
    .chapter-editorial .chapter-note {
      max-width: 50ch;
      margin-bottom: var(--space-8);
      color: var(--muted);
      font-size: var(--text-body);
      line-height: 1.7;
    }
    .chapter-editorial .chapter-entries {
      list-style: none;
      padding: 0;
      margin: 0;
    }
    .chapter-editorial .chapter-entry {
      display: flex;
      align-items: flex-start;
      gap: var(--space-6);
      margin-bottom: var(--space-8);
      padding-left: var(--space-4);
      border-left: 2px solid var(--border);
    }
    .chapter-editorial .chapter-number {
      min-width: 6ch;
      color: var(--accent);
      font-family: var(--font-display);
      font-size: var(--text-h2);
      font-weight: 600;
      letter-spacing: 0.08em;
    }
    .chapter-editorial .chapter-title {
      font-family: var(--font-display);
      font-size: var(--text-h3);
      font-weight: 500;
      margin-bottom: var(--space-2);
    }
    .chapter-editorial .chapter-description {
      color: var(--muted);
      font-size: var(--text-body);
      line-height: 1.7;
    }
    @media (min-width: 1024px) {
      .chapter-editorial-background-content h2 {
        font-size: clamp(12rem, 30vw, 25rem);
      }
      .chapter-editorial-content {
        max-width: 80ch;
      }
      .chapter-editorial .chapter-entry {
        gap: var(--space-8);
        padding-left: var(--space-6);
      }
      .chapter-editorial .chapter-number {
        min-width: 8ch;
        font-size: var(--text-h1);
      }
    }
    @media (prefers-reduced-motion: reduce) {
      .chapter-entry {
        initial: none;
        animate: none;
      }
    }
  `}</style>
);