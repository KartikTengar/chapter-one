"use client";

/**
 * Lightweight decorative campus/architecture skyline for the poster footer.
 * Pure SVG line art — never contains or replaces the functional QR.
 */
export function CampusSkyline({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 700 90"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
      preserveAspectRatio="xMidYMax meet"
    >
      <path
        d="M0 78 L18 62 L34 72 L52 50 L68 72 L86 58 L104 74 L120 66 L138 76 L158 46 L176 72 L196 52 L214 74 L230 68 L248 78 L262 60 L280 76 L300 44 L318 70 L336 54 L354 76 L370 64 L388 78 L406 42 L424 72 L442 56 L462 78 L480 48 L498 72 L516 60 L534 76 L552 50 L570 70 L588 58 L606 76 L624 44 L642 72 L660 60 L680 78 L700 56 L700 90 L0 90 Z"
        fill="currentColor"
        opacity="0.9"
      />
      <path
        d="M52 50 L52 30 M52 30 L58 34 M52 30 L46 34"
        stroke="currentColor"
        strokeWidth="1.5"
        fill="none"
      />
      <path
        d="M158 46 L158 22 M158 22 L166 28 M158 22 L150 28"
        stroke="currentColor"
        strokeWidth="1.5"
        fill="none"
      />
      <path
        d="M300 44 L300 18 M300 18 L309 25 M300 18 L291 25"
        stroke="currentColor"
        strokeWidth="1.5"
        fill="none"
      />
      <path
        d="M406 42 L406 16 M406 16 L416 24 M406 16 L396 24"
        stroke="currentColor"
        strokeWidth="1.5"
        fill="none"
      />
      <path
        d="M552 50 L552 26 M552 26 L561 32 M552 26 L543 32"
        stroke="currentColor"
        strokeWidth="1.5"
        fill="none"
      />
      <path
        d="M624 44 L624 20 M624 20 L633 27 M624 20 L615 27"
        stroke="currentColor"
        strokeWidth="1.5"
        fill="none"
      />
      <circle cx="350" cy="30" r="2.2" fill="currentColor" />
      <circle cx="350" cy="30" r="5" stroke="currentColor" strokeWidth="0.8" fill="none" />
      <circle cx="350" cy="30" r="8" stroke="currentColor" strokeWidth="0.5" fill="none" opacity="0.7" />
      <path d="M350 13 L352 17 L356 17 L353 20 L354 24 L350 22 L346 24 L347 20 L344 17 L348 17 Z"
        fill="currentColor" opacity="0.8" />
      <path
        d="M40 90 C 60 78, 90 82, 110 90"
        stroke="currentColor"
        strokeWidth="1"
        fill="none"
        opacity="0.4"
      />
      <path
        d="M520 90 C 545 76, 585 78, 615 90"
        stroke="currentColor"
        strokeWidth="1"
        fill="none"
        opacity="0.4"
      />
      <path
        d="M0 74 L700 58 L700 0 L0 0 Z"
        fill="url(#htSkyGrad)"
        opacity="0.5"
      />
      <defs>
        <linearGradient id="htSkyGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="currentColor" stopOpacity="0" />
          <stop offset="1" stopColor="currentColor" stopOpacity="0.35" />
        </linearGradient>
      </defs>
    </svg>
  );
}