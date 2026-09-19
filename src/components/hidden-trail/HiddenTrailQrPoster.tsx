"use client";

import { useEffect, useState } from "react";
import { ScanLine } from "lucide-react";
import QRCode from "qrcode";
import { CampusSkyline } from "./CampusSkyline";

/**
 * Reusable CHAPTER ONE — HIDDEN TRAIL marker poster.
 *
 * Everything except the decorative frame is dynamic. The QR encodes the
 * absolute scan URL passed from the server (never a hardcoded token),
 * rendered as a crisp high-resolution SVG with a proper quiet zone.
 */
export function HiddenTrailQrPoster({
  markerNumber,
  levelNumber,
  levelTitle,
  locationClue,
  destination,
  qrValue,
}: {
  markerNumber: number;
  levelNumber: number;
  levelTitle?: string | null;
  locationClue?: string | null;
  destination: string;
  qrValue: string;
}) {
  const number = String(markerNumber).padStart(2, "0");
  const level = String(levelNumber).padStart(2, "0");

  const [qrSvg, setQrSvg] = useState("");

  useEffect(() => {
    let mounted = true;
    if (!qrValue) return;
    QRCode.toString(qrValue, {
      type: "svg",
      margin: 2,
      width: 640,
      color: { dark: "#000000", light: "#ffffff" },
      errorCorrectionLevel: "M",
    })
      .then((svg) => {
        if (mounted) setQrSvg(svg);
      })
      .catch(() => {
        if (mounted) setQrSvg("");
      });
    return () => { mounted = false; };
  }, [qrValue]);

  return (
    <div className="ht-poster">
      <span className="ht-poster-corners" aria-hidden="true">
        <i />
        <i />
        <i />
        <i />
      </span>

      <header className="ht-poster-header">
        <p className="ht-poster-eyebrow">A Chapter One Experience</p>
        <h1 className="ht-poster-title">Chapter One</h1>
        <p className="ht-poster-subtitle">Hidden Trail</p>
      </header>

      <div className="ht-poster-body">
        <div className="ht-poster-qr-wrap">
          <div className="ht-poster-qr">
            {qrSvg ? (
              <div
                role="img"
                aria-label={`QR code for marker ${number} — scan to continue`}
                className="ht-poster-qr-svg"
                dangerouslySetInnerHTML={{ __html: qrSvg }}
              />
            ) : (
              <p>QR unavailable</p>
            )}
          </div>
          <span className="ht-poster-qr-label">
            <ScanLine aria-hidden="true" />
            Scan to Continue
          </span>
        </div>

        <div className="ht-poster-meta">
          <div className="ht-poster-markers">
            <div className="ht-poster-marker-block">
              <p className="ht-poster-meta-label">Marker</p>
              <p className="ht-poster-meta-num">{number}</p>
            </div>
            <div className="ht-poster-marker-block">
              <p className="ht-poster-meta-label">Level</p>
              <p className="ht-poster-meta-num">{level}</p>
              {levelTitle && <p className="ht-poster-meta-title">{levelTitle}</p>}
            </div>
          </div>

          {locationClue && (
            <div className="ht-poster-clue">
              <p className="ht-poster-meta-label">Location Clue</p>
              <p className="ht-poster-clue-text">&ldquo;{locationClue}&rdquo;</p>
            </div>
          )}

          <div className="ht-poster-dest">
            <p className="ht-poster-meta-label">Destination</p>
            <p className="ht-poster-dest-name">{destination}</p>
          </div>
        </div>
      </div>

      <footer className="ht-poster-footer">
        <CampusSkyline className="ht-poster-skyline" />
        <p className="ht-poster-tagline">
          Curiosity Leads <span>Further</span>
        </p>
      </footer>
    </div>
  );
}