"use client";

import { QrCode } from "./QrCode";

export function QrPrintView({
  levelNumber,
  title,
  token,
  locationRiddle,
  origin,
}: {
  levelNumber: number;
  title: string;
  token: string;
  locationRiddle?: string | null;
  /** Absolute origin for the QR payload (e.g. "https://app.example.com").
   *  Falls back to NEXT_PUBLIC_APP_URL env var, then window.location.origin. */
}) {
  // Resolve origin: explicit prop > NEXT_PUBLIC_APP_URL env > window.location.origin
  const resolvedOrigin = origin ?? 
    (typeof process !== "undefined" && process.env?.NEXT_PUBLIC_APP_URL) ?? 
    (typeof window !== "undefined" ? window.location.origin : "");

  return (
    <div className="chapter-qr-print-container">
      <div className="chapter-qr-print-card">
        <div className="chapter-qr-print-header">
          <h1 className="chapter-qr-print-title">CHAPTER ONE</h1>
          <h2 className="chapter-qr-print-subtitle">HIDDEN TRAIL</h2>
        </div>

        <div className="chapter-qr-print-body">
          <div className="chapter-qr-code-frame">
            <QrCode token={token} size={280} label={`Marker ${String(levelNumber).padStart(2, "0")}`} origin={resolvedOrigin} />
          </div>

          <div className="chapter-qr-print-meta">
            <div className="chapter-qr-print-meta-primary">
              <p className="chapter-qr-print-meta-label">MARKER</p>
              <p className="chapter-qr-print-meta-value">{String(levelNumber).padStart(2, "0")}</p>
            </div>

            <div className="chapter-qr-print-meta-secondary">
              <p className="chapter-qr-print-meta-label">LEVEL</p>
              <p className="chapter-qr-print-meta-value">{title}</p>
            </div>

            {locationRiddle && (
              <div className="chapter-qr-print-meta-tertiary">
                <p className="chapter-qr-print-meta-label">LOCATION CLUE</p>
                <p className="chapter-qr-print-meta-value">&ldquo;{locationRiddle}&rdquo;</p>
              </div>
            )}

            <div className="chapter-qr-print-meta-destination">
              <p className="chapter-qr-print-meta-label">DESTINATION</p>
              <p className="chapter-qr-print-meta-value">Hidden Trail</p>
            </div>
          </div>
        </div>

        <div className="chapter-qr-print-instructions">
          <p className="chapter-qr-print-instructions-text">
            Prepare this marker for physical placement. Do not reveal the answer riddle to players.
          </p>
        </div>
      </div>
    </div>
  );
}