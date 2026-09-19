"use client";

import { useEffect, useRef, useState } from "react";
import JSXStyle from "styled-jsx/style";

export function LandingStyles({ id, children }: { id: string; children: string }) {
  return <JSXStyle id={id}>{children}</JSXStyle>;
}

export function Countdown({ startsAt, endsAt, serverNow }: {
  startsAt: string;
  endsAt?: string;
  serverNow: string;
}) {
  const offset = useRef<number | null>(null);
  const [now, setNow] = useState(() => Date.parse(serverNow));

  useEffect(() => {
    if (offset.current === null) offset.current = Date.parse(serverNow) - Date.now();
    const clockOffset = offset.current;
    const interval = window.setInterval(() => setNow(Date.now() + clockOffset), 1000);
    return () => window.clearInterval(interval);
  }, [serverNow]);

  const target = Date.parse(startsAt);
  const end = endsAt === undefined ? null : Date.parse(endsAt);
  if (!Number.isFinite(target) || !Number.isFinite(now)
    || (end !== null && (!Number.isFinite(end) || now >= end))) return null;

  const live = now >= target;
  const remaining = Math.max(0, Math.ceil((target - now) / 1000));
  const values = [
    Math.floor(remaining / 86400),
    Math.floor((remaining % 86400) / 3600),
    Math.floor((remaining % 3600) / 60),
    remaining % 60,
  ];

  return (
    <div className="countdown">
      <p className="now" role="status">{live ? "HAPPENING NOW" : ""}</p>
      {!live && (
        <dl className="units" role="timer" aria-label="Time until the event starts" aria-live="off">
          {["DAYS", "HOURS", "MINUTES", "SECONDS"].map((label, index) => (
            <div className="unit" key={label}>
              <dt>{label}</dt>
              <dd>{String(values[index]).padStart(2, "0")}</dd>
            </div>
          ))}
        </dl>
      )}
      <style jsx>{`
        .countdown { min-height: calc(var(--space-8) * 2); width: 100%; }
        .units { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); margin: 0; }
        .unit { display: flex; flex-direction: column-reverse; align-items: center; gap: var(--space-2); padding: var(--space-2); min-width: 0; }
        .unit + .unit { border-left: 1px solid var(--border); }
        dt { font-size: var(--text-meta); font-weight: 400; color: var(--muted); letter-spacing: 0.08em; }
        dd { margin: 0; font-size: var(--text-display); line-height: 1; font-weight: 500; font-variant-numeric: tabular-nums; color: var(--text); }
        .now { margin: 0; color: var(--accent); font-size: var(--text-label); letter-spacing: 0.16em; text-align: center; }
        .now:not(:empty) { padding-block: var(--space-7); }
        @media (max-width: 639px) {
          dd { font-size: var(--text-h1); }
          dt { font-size: var(--text-meta); letter-spacing: 0; }
          .unit { padding-inline: var(--space-1); }
        }
      `}</style>
    </div>
  );
}

export default Countdown;
