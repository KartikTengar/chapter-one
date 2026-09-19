import { connection } from "next/server";
import { getFeaturedEvent } from "@/lib/api/events";
import { Countdown, LandingStyles } from "./Countdown";

export async function CountdownMoment() {
  await connection();
  const event = await getFeaturedEvent();
  if (!event) return null;

  const serverNow = new Date().toISOString();
  if (event.ends_at && Date.parse(serverNow) >= Date.parse(event.ends_at)) return null;

  const start = new Date(event.starts_at);
  if (!Number.isFinite(start.getTime())) return null;

  const date = new Intl.DateTimeFormat("en-IN", {
    timeZone: "Asia/Kolkata",
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(start);
  const time = new Intl.DateTimeFormat("en-IN", {
    timeZone: "Asia/Kolkata",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
    timeZoneName: "short",
  }).format(start);

  return (
    <section className="countdown-moment" aria-labelledby="countdown-moment-heading">
      <div className="container-c1">
        <div className="countdown-moment-frame">
          <p className="countdown-moment-eyebrow">MARK THE DATE</p>
          <h2 id="countdown-moment-heading">
            <time dateTime={event.starts_at}>{date}<span>{time}</span></time>
          </h2>
          <Countdown startsAt={event.starts_at} endsAt={event.ends_at} serverNow={serverNow} />
        </div>
      </div>
      <LandingStyles id="landing-countdown-moment">{`
        .countdown-moment { padding-block: var(--space-7); background: var(--bg); }
        .countdown-moment:not(:has(.countdown)) { display: none; }
        .countdown-moment-frame { border: 1px solid var(--border); border-radius: var(--radius-card); padding: var(--space-7) var(--space-4); text-align: center; }
        .countdown-moment-eyebrow { color: var(--accent); font-size: var(--text-label); letter-spacing: 0.16em; margin-bottom: var(--space-5); }
        #countdown-moment-heading { margin-bottom: var(--space-7); font-family: var(--font-display); font-size: var(--text-display); font-weight: 400; line-height: 1.1; }
        #countdown-moment-heading span { display: block; margin-top: var(--space-4); font-size: var(--text-h2); color: var(--muted); }
        @media (min-width: 768px) {
          .countdown-moment { padding-block: var(--space-9); }
          .countdown-moment-frame { padding: var(--space-8) var(--space-7); }
        }
      `}</LandingStyles>
    </section>
  );
}

export default CountdownMoment;
