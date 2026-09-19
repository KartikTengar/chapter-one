"use client";

import { useEffect, useRef } from "react";
import QRCode from "qrcode";

/**
 * Renders a printable QR code for a Hidden Trail scan token.
 *
 * The QR encodes an absolute scan URL so a phone camera scan opens the
 * correct route regardless of where the page is printed from.
 * The component keeps a stable canvas so the same token always renders identically.
 */
export function QrCode({
  token,
  size = 256,
  label,
  origin,
}: {
  token: string;
  size?: number;
  label?: string;
  /** Absolute origin for the QR payload (e.g. "https://app.example.com"). 
   *  If omitted, falls back to window.location.origin (client-side only). 
   *  For server-side rendering/printing, always pass the production origin explicitly. */
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    let mounted = true;
    // Resolve origin: prefer explicit prop, then window.location.origin (client only)
    const resolvedOrigin = origin ?? (typeof window !== "undefined" ? window.location.origin : "");
    if (!resolvedOrigin) {
      console.warn("[QrCode] No origin available - QR payload may be relative");
    }
    const target = resolvedOrigin ? `${resolvedOrigin}/hidden-trail/scan/${token}` : `/hidden-trail/scan/${token}`;
    
    QRCode.toCanvas(canvasRef.current, target, {
      width: size,
      margin: 2,
      color: { dark: "#0a0a0a", light: "#ffffff" },
      errorCorrectionLevel: "M",
    })
      .catch(() => {
        // Fall back to data URL on canvas failure (rare).
        if (!mounted || !canvasRef.current) return;
        QRCode.toDataURL(target, { width: size, margin: 2 })
          .then((dataUrl) => {
            if (!mounted || !canvasRef.current) return;
            const img = new Image();
            img.onload = () => {
              const ctx = canvasRef.current!.getContext("2d");
              ctx?.drawImage(img, 0, 0, size, size);
            };
            img.src = dataUrl;
          })
          .catch(() => { /* ignore */ });
      });
    return () => { mounted = false; };
  }, [token, size, origin]);

  return (
    <div className="qr-code-print text-center">
      <canvas
        ref={canvasRef}
        width={size}
        height={size}
        className="mx-auto rounded-lg border border-white/[0.08] bg-white"
        style={{ width: size, height: size }}
        aria-label={`QR code for ${label ?? "marker"}`}
      />
      {label && (
        <p className="mt-2 font-mono text-sm text-[var(--muted)]">{label}</p>
      )}
    </div>
  );
}