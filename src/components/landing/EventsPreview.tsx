import "server-only";
import Image from "next/image";
import Link from "next/link";
import css from "styled-jsx/css";
import { Container, Section } from "@/components/layout";
import { Chip } from "@/components/ui/Chip";
import { getEventPreviews } from "@/lib/api/events";
import type { EventPreview } from "@/lib/api/types";

const styles = css.global`
  .events-preview {
    color: var(--text);
    font-family: var(--font-ui);
    position: relative;
    overflow: hidden;
  }
  .events-preview::before {
    content: "";
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: radial-gradient(circle at 30% 20%, color-mix(in srgb, var(--accent) 3%, var(--transparent)) 0%, transparent 50%);
    pointer-events: none;
    z-index: 0;
  }
  .events-preview-content {
    position: relative;
    z-index: 2;
  }
  .events-preview .lineup-header {
    display: flex;
    align-items: flex-end;
    justify-content: space-between;
    flex-wrap: wrap;
    gap: var(--space-5);
    margin-bottom: var(--space-8);
  }
  .events-preview .lineup-label {
    margin: 0 0 var(--space-3);
    color: var(--accent);
    font-size: var(--text-label);
    letter-spacing: 0.14em;
    text-transform: uppercase;
  }
  .events-preview h2 {
    margin: 0;
    font-family: var(--font-display);
    font-size: var(--text-h2);
    font-weight: 400;
    line-height: 1.2;
    letter-spacing: -0.02em;
  }
  .events-preview .lineup-link {
    display: inline-flex;
    align-items: center;
    min-height: var(--space-7);
    color: var(--accent);
    font-size: var(--text-label);
    text-decoration: none;
    letter-spacing: 0.04em;
  }
  .events-preview .lineup-link:hover {
    text-decoration: underline;
    text-underline-offset: var(--space-1);
  }
  .events-preview .event-title-link {
    color: inherit;
    text-decoration: none;
  }
  .events-preview .event-title-link:hover {
    text-decoration: underline;
    text-underline-offset: var(--space-1);
  }
  .events-preview a:focus-visible {
    outline: 2px solid var(--accent);
    outline-offset: var(--space-1);
  }
  .events-preview .lineup-empty {
    padding: var(--space-9) var(--space-5);
    border: 1px solid var(--border);
    text-align: center;
  }
  .events-preview .empty-title {
    margin: 0 0 var(--space-3);
    font-family: var(--font-display);
    font-size: var(--text-h1);
    font-weight: 400;
    letter-spacing: -0.02em;
  }
  .events-preview .lineup-muted {
    margin: 0;
    color: var(--muted);
    font-size: var(--text-body);
    line-height: 1.6;
  }
  .events-preview .featured-event {
    position: relative;
    isolation: isolate;
    display: grid;
    overflow: hidden;
    margin-bottom: var(--space-12);
  }
  .events-preview .featured-event-image {
    position: relative;
    border-radius: var(--radius-card);
    overflow: hidden;
    aspect-ratio: 16 / 9;
  }
  .events-preview .featured-event-image img {
    object-fit: cover;
    object-position: center;
    width: 100%;
    height: 100%;
    display: block;
    transition: transform var(--dur-normal) var(--ease);
  }
  .events-preview .featured-event-image:hover img {
    transform: scale(1.05);
  }
  .events-preview .featured-event-content {
    position: absolute;
    bottom: 0;
    left: 0;
    right: 0;
    padding: var(--space-6) var(--space-7) var(--space-5);
    z-index: 2;
    background: linear-gradient(transparent, var(--surface) 60%);
  }
  .events-preview .featured-event-date {
    display: flex;
    flex-direction: column;
    gap: var(--space-1);
    margin-bottom: var(--space-3);
  }
  .events-preview .featured-event-day {
    font-family: var(--font-display);
    font-size: calc(var(--text-h1) * 1.4);
    font-weight: 400;
    color: var(--accent);
    line-height: 1;
    letter-spacing: 0.04em;
  }
  .events-preview .featured-event-month {
    font-size: var(--text-meta);
    text-transform: uppercase;
    letter-spacing: 0.1em;
    color: var(--muted);
  }
  .events-preview .featured-event-title {
    font-family: var(--font-display);
    font-size: var(--text-h2);
    font-weight: 500;
    line-height: 1.2;
    margin-bottom: var(--space-3);
    letter-spacing: -0.02em;
    color: var(--text);
  }
  .events-preview .featured-event-venue {
    font-size: var(--text-meta);
    color: var(--muted);
    margin-bottom: var(--space-4);
  }
  .events-preview .featured-event-chip {
    align-self: start;
  }
  .events-preview .supporting-events {
    margin-top: var(--space-8);
  }
  .events-preview .supporting-events h3 {
    margin: 0 0 var(--space-4);
    font-family: var(--font-display);
    font-size: var(--text-h3);
    font-weight: 500;
    color: var(--text);
    letter-spacing: -0.02em;
  }
  .events-preview .event-grid {
    display: grid;
    gap: var(--space-6);
  }
  .events-preview .event-card {
    position: relative;
    isolation: isolate;
    overflow: hidden;
    border-radius: var(--radius-card);
    background: var(--surface);
    border: 1px solid var(--border);
    transition:
      border-color var(--dur-normal) var(--ease),
      box-shadow var(--dur-normal) var(--ease);
  }
  .events-preview .event-card:hover {
    border-color: var(--accent);
    box-shadow: var(--shadow-elevated);
  }
  .events-preview .event-card-image {
    position: relative;
    overflow: hidden;
    aspect-ratio: 16 / 9;
  }
  .events-preview .event-card-image img {
    object-fit: cover;
    object-position: center;
    width: 100%;
    height: 100%;
    display: block;
    transition: transform var(--dur-normal) var(--ease);
  }
  .events-preview .event-card:hover .event-card-image img {
    transform: scale(1.08);
  }
  .events-preview .event-card-content {
    padding: var(--space-5);
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    min-height: 0;
  }
  .events-preview .event-card-title {
    font-family: var(--font-display);
    font-size: var(--text-h3);
    font-weight: 500;
    margin-bottom: var(--space-2);
    line-height: 1.3;
    letter-spacing: -0.02em;
    color: var(--text);
    overflow: hidden;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
  }
  .events-preview .event-card-venue {
    font-size: var(--text-meta);
    color: var(--muted);
    margin-top: auto;
  }
  .events-preview .event-card-date-chip {
    margin-top: var(--space-3);
  }
  .events-preview .event-card-badge {
    position: absolute;
    top: var(--space-3);
    left: var(--space-3);
    padding: var(--space-1) var(--space-2);
    background: var(--accent);
    color: var(--bg);
    font-family: var(--font-ui);
    font-size: var(--text-meta);
    font-weight: 600;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    opacity: 0;
    transition: opacity var(--dur-fast) var(--ease);
  }
  .events-preview .event-card:hover .event-card-badge {
    opacity: 1;
  }
  @media (min-width: 768px) {
    .events-preview .featured-event {
      grid-template-columns: minmax(0, 1.05fr) minmax(0, .95fr);
      align-items: stretch;
      min-height: 360px;
      border: 1px solid var(--border);
      border-radius: var(--radius-card);
      background: var(--surface);
    }
    .events-preview .featured-event-image {
      aspect-ratio: 16 / 9;
    }
    .events-preview .featured-event-image {
      height: 100%;
      min-height: 360px;
      border-radius: var(--radius-card) 0 0 var(--radius-card);
    }
    .events-preview .featured-event-content {
      position: relative;
      inset: auto;
      display: flex;
      flex-direction: column;
      justify-content: center;
      padding: var(--space-8);
      background: linear-gradient(135deg, var(--surface-2), var(--surface));
    }
  }
  @media (prefers-reduced-motion: reduce) {
    .events-preview .event-card {
      transition: none;
    }
    .events-preview .event-card:hover {
      border-color: var(--accent);
      box-shadow: none;
    }
    .events-preview .event-card-image img {
      transition: none;
    }
  }
`;

function EventDate({ startsAt }: { startsAt: string }) {
  const date = new Date(startsAt);
  const options = { timeZone: "Asia/Kolkata" };

  return (
    <time
      className="lineup-date"
      dateTime={startsAt}
      aria-label={date.toLocaleDateString("en-IN", { ...options, dateStyle: "full" })}
    >
      <span className="date-day">{date.toLocaleDateString("en-IN", { ...options, day: "2-digit" })}</span>
      <span>{date.toLocaleDateString("en-IN", { ...options, month: "short" })}</span>
    </time>
  );
}

function RegistrationState({ open, className }: { open: boolean; className?: string }) {
  return <Chip variant={open ? "success" : "default"} className={className}>{open ? "Registration open" : "Closed"}</Chip>;
}

function eventHref(event: EventPreview): string {
  return event.is_demo ? "/events" : `/events/${encodeURIComponent(event.id)}`;
}

export async function EventsPreview() {
  const events = await getEventPreviews();
  const featured = events?.[0];
  const supporting = events?.slice(1) ?? [];

  return (
    <Section className="events-preview" aria-labelledby="lineup-heading">
      <div className="events-preview-content">
        <Container>
          <header className="lineup-header">
            <div>
              <p className="lineup-label">THE LINEUP</p>
              <h2 id="lineup-heading">Upcoming events</h2>
            </div>
            <Link className="lineup-link" href="/events">View all →</Link>
          </header>
          {!featured ? (
            <div className="lineup-empty">
              <h3 className="empty-title">
                {events === null ? "The lineup is temporarily unavailable." : "Lineup drops soon."}
              </h3>
              <p className="lineup-muted">
                {events === null
                  ? "Please try again shortly."
                  : "Good things are taking shape. Check back for your next campus moment."}
              </p>
            </div>
          ) : (
            <>
              {/* Featured Event */}
              <div className="featured-event">
                <div className="featured-event-image">
                  <Image
                    src={featured.cover_url ?? "/images/hero.jpg"}
                    alt={featured.title}
                    fill
                    sizes="(max-width: 768px) 100vw, 50vw"
                    priority
                    className="featured-event-image-img"
                  />
                </div>
                <div className="featured-event-content">
                  <div className="featured-event-date">
                    <EventDate startsAt={featured.starts_at} />
                    <p className="featured-event-month">{new Date(featured.starts_at).toLocaleDateString("en-IN", { month: "short" })}</p>
                  </div>
                  <h1 className="featured-event-title">{featured.title}</h1>
                  <p className="featured-event-venue">{featured.venue}</p>
                  <RegistrationState open={featured.registration_open} className="featured-event-chip" />
                </div>
              </div>

              {/* Supporting Events */}
              {supporting.length > 0 && (
                <div className="supporting-events">
                  <h3>More upcoming events</h3>
                  <div className="event-grid">
                    {supporting.map((event) => (
                      <div key={event.id} className="event-card">
                        <div className="event-card-image">
                          <Image
                            src={event.cover_url ?? "/images/hero.jpg"}
                            alt={event.title}
                            sizes="(max-width: 768px) 100vw, 280px"
                            className="event-card-image-img"
                          />
                        </div>
                        <div className="event-card-content">
                          <h3 className="event-card-title">
                            <Link className="event-title-link" href={eventHref(event)}>{event.title}</Link>
                          </h3>
                          <p className="event-card-venue">{event.venue}</p>
                          <RegistrationState open={event.registration_open} className="event-card-date-chip" />
                          <span className="event-card-badge">{event.registration_open ? "OPEN" : "CLOSED"}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </Container>
      </div>
      <style>{String(styles)}</style>
    </Section>
  );
}

export default EventsPreview;