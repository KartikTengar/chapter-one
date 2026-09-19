import Link from "next/link";
import css from "styled-jsx/css";

const columns = [
  {
    title: "Explore",
    links: [
      { label: "Events", href: "/events" },
      { label: "Experiences", href: "/#experiences" },
      { label: "Hidden Trail", href: "/hidden-trail" },
      { label: "About", href: "/#chapter" },
    ],
  },
  {
    title: "Account",
    links: [
      { label: "Login", href: "/login" },
      { label: "Sign Up", href: "/signup" },
    ],
  },
];

const styles = css.global`
  .chapter-footer {
    background: var(--bg);
    color: var(--text);
    font-family: var(--font-ui);
    border-top: 1px solid var(--border);
  }
  .chapter-footer .footer-inner {
    max-width: calc(var(--space-10) * 11);
    margin-inline: auto;
    padding: var(--space-7) var(--space-4) 0;
  }
  .chapter-footer .footer-top {
    display: grid;
    gap: var(--space-7);
    padding-bottom: var(--space-7);
  }
  .chapter-footer .footer-wordmark {
    display: inline-flex;
    align-items: baseline;
    gap: var(--space-2);
    white-space: nowrap;
    text-decoration: none;
    line-height: 1;
  }
  .chapter-footer .chapter {
    font-family: var(--font-display);
    font-size: var(--text-h3);
    font-weight: 500;
    color: var(--accent);
  }
  .chapter-footer .one {
    font-size: var(--text-label);
    font-weight: 700;
    letter-spacing: 0.12em;
    color: var(--text);
  }
  .chapter-footer .tagline {
    margin: var(--space-3) 0 0;
    font-size: var(--text-label);
    line-height: 1.6;
    color: var(--muted);
  }
  .chapter-footer .footer-navigation {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: var(--space-4);
  }
  .chapter-footer h2 {
    margin: 0 0 var(--space-3);
    font-size: var(--text-meta);
    font-weight: 600;
    line-height: 1.5;
    text-transform: uppercase;
    letter-spacing: 0.12em;
    color: var(--text);
  }
  .chapter-footer ul { list-style: none; padding: 0; margin: 0; }
  .chapter-footer .footer-link {
    display: inline-block;
    padding-block: var(--space-2);
    color: var(--muted);
    font-size: var(--text-label);
    line-height: 1.4;
    text-decoration: none;
    transition: color var(--dur-fast) var(--ease);
  }
  .chapter-footer .footer-link:hover { color: var(--accent); }
  .chapter-footer a:focus-visible {
    outline: 2px solid var(--accent);
    outline-offset: var(--space-1);
    border-radius: var(--radius-btn);
  }
  .chapter-footer .footer-bottom {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    justify-content: space-between;
    gap: var(--space-3);
    padding-block: var(--space-4);
    border-top: 1px solid var(--border);
  }
  .chapter-footer .copyright {
    margin: 0;
    font-size: var(--text-meta);
    line-height: 1.5;
    color: var(--muted);
  }
  .chapter-footer .policy-labels li { padding-block: var(--space-2); color: var(--muted); font-size: var(--text-label); line-height: 1.4; }
  .chapter-footer .policy-note { margin: var(--space-2) 0 0; color: var(--muted); font-size: var(--text-meta); line-height: 1.5; }
  @media (min-width: 640px) {
    .chapter-footer .footer-inner { padding-inline: var(--space-5); }
    .chapter-footer .footer-navigation { gap: var(--space-6); }
  }
  @media (min-width: 1024px) {
    .chapter-footer .footer-inner { padding-inline: var(--space-7); }
    .chapter-footer .footer-top { grid-template-columns: 1fr 1fr; gap: var(--space-8); }
  }
  @media (prefers-reduced-motion: reduce) {
    .chapter-footer .footer-link { transition: none; }
  }
`;

export function Footer() {
  return (
    <footer className="chapter-footer" aria-label="Site footer">
      <div className="footer-inner">
        <div className="footer-top">
          <div className="footer-brand">
            <Link href="/" className="footer-wordmark" aria-label="Chapter One home">
              <span className="chapter">CHAPTER</span><span className="one">ONE</span>
            </Link>
            <p className="tagline">Your college journey starts here.</p>
          </div>
          <nav className="footer-navigation" aria-label="Footer navigation">
            {columns.map((column) => (
              <div key={column.title}>
                <h2>{column.title}</h2>
                <ul>
                  {column.links.map((link) => (
                    <li key={link.label}>
                      <Link className="footer-link" href={link.href}>{link.label}</Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
            <div>
              <h2>Legal</h2>
              <ul className="policy-labels">
                <li>Privacy</li>
                <li>Terms</li>
              </ul>
              <p className="policy-note">Policies available before registration opens</p>
            </div>
          </nav>
        </div>
        <div className="footer-bottom">
          <p className="copyright">© 2026 CHAPTER ONE</p>
        </div>
      </div>
      <style>{String(styles)}</style>
    </footer>
  );
}
