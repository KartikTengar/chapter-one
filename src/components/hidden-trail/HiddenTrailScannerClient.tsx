"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import jsQR from "jsqr";
import { X, RefreshCw, Loader2, Camera, Upload, Zap } from "lucide-react";

type ScannerErrorType = "permission" | "no-camera" | "insecure" | "generic" | "not-trail-qr" | "none";

interface ScannerError {
  type: ScannerErrorType;
  message: string;
}

type ScanStatus = "idle" | "starting" | "scanning" | "processing";

const TOKEN_PATTERN = /^[A-Za-z0-9._~-]{8,256}$/;

function extractTrailToken(data: string): string | null {
  const trimmed = data.trim();
  if (!trimmed) return null;
  try {
    if (/^https?:\/\//i.test(trimmed)) {
      const url = new URL(trimmed);
      if (url.origin !== window.location.origin) return null;
      const m = url.pathname.match(/^\/hidden-trail\/scan\/([^/]+)\/?$/);
      if (m && TOKEN_PATTERN.test(decodeURIComponent(m[1]))) return decodeURIComponent(m[1]);
      return null;
    }
    const m = trimmed.match(/^\/?hidden-trail\/scan\/([^/?#]+)\/?$/);
    if (m && TOKEN_PATTERN.test(decodeURIComponent(m[1]))) return decodeURIComponent(m[1]);
    if (TOKEN_PATTERN.test(trimmed)) return trimmed;
    return null;
  } catch {
    return null;
  }
}

const VISION_COOLDOWN_MS = 10000;
const MAX_VISION_CALLS = 3;

export function HiddenTrailScannerClient() {
  const router = useRouter();
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const animRef = useRef(0);
  const scanningRef = useRef(false);
  const processingRef = useRef(false);
  const startingRef = useRef(false);
  const mountedRef = useRef(true);
  const lastDecodeAtRef = useRef(0);
  const lastVisionCallRef = useRef(0);
  const visionCallCountRef = useRef(0);

  const [status, setStatus] = useState<ScanStatus>("idle");
  const [error, setError] = useState<ScannerError>({ type: "none", message: "" });
  const [facingMode, setFacingMode] = useState<"environment" | "user">("environment");
  const [secureOk, setSecureOk] = useState(true);
  const [visionStatus, setVisionStatus] = useState<"idle" | "loading" | "success" | "error">("idle");

  const clearError = useCallback(() => {
    setError({ type: "none", message: "" });
  }, []);

  const stopCamera = useCallback(() => {
    scanningRef.current = false;
    processingRef.current = false;
    startingRef.current = false;
    if (animRef.current) {
      cancelAnimationFrame(animRef.current);
      animRef.current = 0;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    if (mountedRef.current) setStatus("idle");
  }, []);

  const handleDecoded = useCallback((data: string) => {
    if (processingRef.current) return;
    processingRef.current = true;
    scanningRef.current = false;
    if (animRef.current) {
      cancelAnimationFrame(animRef.current);
      animRef.current = 0;
    }
    const token = extractTrailToken(data);
    if (!token) {
      processingRef.current = false;
      setError({
        type: "not-trail-qr",
        message: "NOT A TRAIL QR\nThis code is not a Hidden Trail marker.\nPoint at a Hidden Trail QR and try again.",
      });
      scanningRef.current = true;
      return;
    }
    if (mountedRef.current) setStatus("processing");
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    router.push(`/hidden-trail/scan/${encodeURIComponent(token)}`);
  }, [router]);

  const triggerVisionFallback = useCallback(async () => {
    if (visionCallCountRef.current >= MAX_VISION_CALLS) {
      setError({
        type: "generic",
        message: "VISION LIMIT REACHED\nMaximum Google Vision fallback attempts used.",
      });
      return;
    }

    const now = Date.now();
    if (now - lastVisionCallRef.current < VISION_COOLDOWN_MS) {
      const waitSec = Math.ceil((VISION_COOLDOWN_MS - (now - lastVisionCallRef.current)) / 1000);
      setError({
        type: "generic",
        message: `VISION COOLDOWN\nPlease wait ${waitSec}s before trying Google Vision again.`,
      });
      return;
    }

    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas || video.videoWidth === 0) {
      setError({ type: "generic", message: "NO CAMERA FRAME\nCamera not ready for Vision fallback." });
      return;
    }

    lastVisionCallRef.current = now;
    visionCallCountRef.current += 1;
    setVisionStatus("loading");
    clearError();

    try {
      const w = Math.min(video.videoWidth, 960);
      const h = Math.round((w * video.videoHeight) / video.videoWidth);
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext("2d", { willReadFrequently: true });
      if (!ctx) throw new Error("Canvas context unavailable");
      ctx.drawImage(video, 0, 0, w, h);

      const dataUrl = canvas.toDataURL("image/jpeg", 0.85);
      const base64 = dataUrl.split(",")[1];

      const apiBase = process.env.NEXT_PUBLIC_API_URL || "";
      const res = await fetch(`${apiBase}/api/v1/trail/vision-decode`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ image: base64, mime: "image/jpeg" }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        if (res.status === 429) {
          setVisionStatus("error");
          setError({ type: "generic", message: "VISION RATE LIMITED\nGoogle Vision quota exceeded. Continuing with local scanner." });
          return;
        }
        throw new Error(err.error?.message ?? `Vision failed (${res.status})`);
      }

      const data = await res.json();
      if (!data.decoded) {
        if (data.rejected === "NOT_A_TRAIL_QR") {
          setVisionStatus("error");
          setError({
            type: "not-trail-qr",
            message: "NOT A TRAIL QR\nGoogle Vision could not find a valid Hidden Trail marker.",
          });
        } else {
          setVisionStatus("error");
        }
        return;
      }

      setVisionStatus("success");
      const token = data.decoded;
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop());
        streamRef.current = null;
      }
      if (animRef.current) {
        cancelAnimationFrame(animRef.current);
        animRef.current = 0;
      }
      scanningRef.current = false;
      processingRef.current = true;
      if (mountedRef.current) setStatus("processing");
      router.push(`/hidden-trail/scan/${encodeURIComponent(token)}`);

    } catch (err: unknown) {
      setVisionStatus("error");
      const msg = err instanceof Error ? err.message : "Vision fallback failed";
      setError({ type: "generic", message: `VISION ERROR\n${msg}` });
    }
  }, [clearError]);

  const startScanLoop = useCallback(() => {
    const scan = () => {
      if (!scanningRef.current || processingRef.current) return;
      const video = videoRef.current;
      const canvas = canvasRef.current;
      if (!video || !canvas || video.readyState < 2 || video.videoWidth === 0) {
        animRef.current = requestAnimationFrame(scan);
        return;
      }
      const now = performance.now();
      if (now - lastDecodeAtRef.current < 150) {
        animRef.current = requestAnimationFrame(scan);
        return;
      }
      lastDecodeAtRef.current = now;
      const ctx = canvas.getContext("2d", { willReadFrequently: true });
      if (!ctx) {
        animRef.current = requestAnimationFrame(scan);
        return;
      }
      const w = Math.min(video.videoWidth, 960);
      const h = Math.round((w * video.videoHeight) / video.videoWidth);
      if (canvas.width !== w || canvas.height !== h) {
        canvas.width = w;
        canvas.height = h;
      }
      ctx.drawImage(video, 0, 0, w, h);
      try {
        const imageData = ctx.getImageData(0, 0, w, h);
        const code = jsQR(imageData.data, w, h);
        if (code?.data) {
          handleDecoded(code.data);
          return;
        }
      } catch {
      }
      animRef.current = requestAnimationFrame(scan);
    };
    if (animRef.current) cancelAnimationFrame(animRef.current);
    animRef.current = requestAnimationFrame(scan);
  }, [handleDecoded]);

  const startCamera = useCallback(async () => {
    if (startingRef.current || processingRef.current) return;
    startingRef.current = true;
    clearError();
    setStatus("starting");

    try {
      const hostname = window.location.hostname;
      const isLocalhost = hostname === "localhost" || hostname === "127.0.0.1" || hostname === "::1";
      if (!window.isSecureContext && !isLocalhost) {
        setSecureOk(false);
        setError({
          type: "insecure",
          message: "CAMERA REQUIRES HTTPS\nOpen the game using the secure event URL.\nCamera access is blocked on insecure connections.",
        });
        setStatus("idle");
        startingRef.current = false;
        return;
      }
      setSecureOk(true);

      if (!navigator.mediaDevices?.getUserMedia) {
        setError({
          type: "no-camera",
          message: "NO CAMERA FOUND\nThis device does not have an available camera.",
        });
        setStatus("idle");
        startingRef.current = false;
        return;
      }

      let stream: MediaStream | null = null;
      const attempts: MediaStreamConstraints[] = [
        { video: { facingMode: { exact: facingMode }, width: { ideal: 1280 }, height: { ideal: 720 } }, audio: false },
        { video: { facingMode, width: { ideal: 1280 }, height: { ideal: 720 } }, audio: false },
        { video: true, audio: false },
      ];
      let lastErr: unknown = null;
      for (const constraints of attempts) {
        try {
          stream = await navigator.mediaDevices.getUserMedia(constraints);
          break;
        } catch (e) {
          lastErr = e;
          stream = null;
        }
      }
      if (!stream) throw lastErr ?? new Error("getUserMedia failed");

      if (!mountedRef.current) {
        stream.getTracks().forEach((t) => t.stop());
        return;
      }
      streamRef.current = stream;
      const video = videoRef.current;
      if (!video) throw new Error("Video element missing");
      video.srcObject = stream;
      await video.play();
      if (!mountedRef.current) return;
      scanningRef.current = true;
      setStatus("scanning");
      startScanLoop();
    } catch (err: unknown) {
      const e = err as { name?: string };
      if (e?.name === "NotAllowedError" || e?.name === "PermissionDeniedError") {
        setError({
          type: "permission",
          message: "CAMERA ACCESS BLOCKED\nYour browser is not allowing camera access.\nAllow camera access for this site and try again.",
        });
      } else if (e?.name === "NotFoundError" || e?.name === "DevicesNotFoundError" || e?.name === "OverconstrainedError") {
        setError({
          type: "no-camera",
          message: "NO CAMERA FOUND\nThis device does not have an available camera.",
        });
      } else if (e?.name === "NotReadableError" || e?.name === "TrackStartError") {
        setError({
          type: "generic",
          message: "CAMERA IN USE\nThe camera is already in use by another application.\nClose other apps using the camera and try again.",
        });
      } else if (e?.name === "SecurityError") {
        setError({
          type: "insecure",
          message: "CAMERA REQUIRES HTTPS\nOpen the game using the secure event URL.",
        });
      } else {
        setError({
          type: "generic",
          message: "CAMERA ERROR\nUnable to start the camera. Please try again.",
        });
      }
      setStatus("idle");
    } finally {
      startingRef.current = false;
    }
  }, [facingMode, clearError, startScanLoop]);

  const switchCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    if (animRef.current) {
      cancelAnimationFrame(animRef.current);
      animRef.current = 0;
    }
    scanningRef.current = false;
    setFacingMode((prev) => (prev === "environment" ? "user" : "environment"));
  }, []);

  const handleFile = useCallback(async (file: File) => {
    clearError();
    if (!file.type.startsWith("image/")) {
      setError({ type: "generic", message: "INVALID FILE\nPlease choose an image file." });
      return;
    }
    if (file.size > 8 * 1024 * 1024) {
      setError({ type: "generic", message: "FILE TOO LARGE\nPlease choose an image under 8 MB." });
      return;
    }
    try {
      const bitmap = await createImageBitmap(file);
      const canvas = document.createElement("canvas");
      const scale = Math.min(1, 960 / Math.max(bitmap.width, bitmap.height));
      canvas.width = Math.round(bitmap.width * scale);
      canvas.height = Math.round(bitmap.height * scale);
      const ctx = canvas.getContext("2d", { willReadFrequently: true });
      if (!ctx) throw new Error("canvas");
      ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const code = jsQR(imageData.data, canvas.width, canvas.height);
      bitmap.close?.();
      if (!code?.data) {
        setError({ type: "generic", message: "NO QR FOUND\nNo QR code was detected in this image." });
        return;
      }
      handleDecoded(code.data);
    } catch {
      setError({ type: "generic", message: "COULDN'T READ IMAGE\nPlease try a clearer photo of the QR." });
    }
  }, [clearError, handleDecoded]);

  const prevFacingRef = useRef(facingMode);
  useEffect(() => {
    if (prevFacingRef.current !== facingMode && (status === "scanning" || status === "starting")) {
      prevFacingRef.current = facingMode;
      void startCamera();
      return;
    }
    prevFacingRef.current = facingMode;
  }, [facingMode, status, startCamera]);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      scanningRef.current = false;
      processingRef.current = false;
      startingRef.current = false;
      if (animRef.current) cancelAnimationFrame(animRef.current);
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop());
        streamRef.current = null;
      }
    };
  }, []);

  const closeScanner = useCallback(() => {
    if (animRef.current) cancelAnimationFrame(animRef.current);
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    scanningRef.current = false;
    processingRef.current = false;
    router.push("/hidden-trail");
  }, [router]);

  const statusLabel =
    status === "idle" ? "IDLE"
    : status === "starting" ? "STARTING CAMERA"
    : status === "processing" ? "QR DETECTED"
    : "SCANNING";

  return (
    <div className="bg-[var(--background)] min-h-screen">
      <div className="max-container mx-auto px-4 py-6 md:py-10">
        <div className="text-center mb-6">
          <p className="label mb-3">HIDDEN TRAIL</p>
          <h1 className="text-3xl md:text-4xl font-black text-[var(--foreground)] uppercase tracking-tight">
            Scan the marker
          </h1>
          <p className="mt-3 text-[var(--muted)] max-w-xl mx-auto">
            Use your phone camera to scan the Hidden Trail QR marker.
          </p>
          <p className="mt-2 text-xs font-semibold uppercase tracking-widest text-[var(--muted)]" role="status" aria-live="polite">
            {statusLabel}
          </p>
        </div>

        <div className="mx-auto max-w-full sm:max-w-md">
          <div className="bg-[var(--surface)] border border-white/[0.06] rounded-2xl overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 border-b border-white/[0.06]">
              <span className="text-xs font-bold uppercase tracking-widest text-[var(--foreground)]">
                Live camera
              </span>
              <button
                onClick={closeScanner}
                className="flex items-center justify-center w-9 h-9 rounded-xl bg-[var(--background)] border border-white/[0.06] text-[var(--foreground)] hover:bg-white/[0.03] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]"
                aria-label="Close scanner and return to Hidden Trail"
              >
                <X className="h-5 w-5" aria-hidden="true" />
              </button>
            </div>

            <div className="relative w-full bg-black" style={{ aspectRatio: "4/3" }}>
              <video
                ref={videoRef}
                className="absolute inset-0 h-full w-full object-cover"
                playsInline
                muted
                autoPlay
                aria-label="Camera preview"
              />
              <canvas ref={canvasRef} className="absolute h-0 w-0 opacity-0" aria-hidden="true" />

              {(status === "scanning" || status === "processing") && (
                <div className="pointer-events-none absolute inset-0 flex items-center justify-center" aria-hidden="true">
                  <div className="relative" style={{ width: "70%", aspectRatio: "1/1", maxWidth: "320px" }}>
                    <div className="absolute inset-0 border-2 border-[var(--accent)] rounded-xl" />
                    <div className="absolute top-0 left-0 h-10 w-10 border-t-2 border-l-2 border-[var(--accent)] rounded-tl-xl" />
                    <div className="absolute top-0 right-0 h-10 w-10 border-t-2 border-r-2 border-[var(--accent)] rounded-tr-xl" />
                    <div className="absolute bottom-0 left-0 h-10 w-10 border-b-2 border-l-2 border-[var(--accent)] rounded-bl-xl" />
                    <div className="absolute bottom-0 right-0 h-10 w-10 border-b-2 border-r-2 border-[var(--accent)] rounded-br-xl" />
                    <div className="absolute left-0 right-0 top-0 h-1 bg-[var(--accent)] animate-scan-line rounded-t-xl" style={{ animationDuration: "2s" }} />
                  </div>
                </div>
              )}

              {status === "idle" && error.type === "none" && (
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 bg-[var(--background)] p-6 text-center">
                  <div className="flex h-16 w-16 items-center justify-center rounded-full bg-white/[0.06] border border-white/[0.06]">
                    <Camera className="h-8 w-8 text-[var(--accent)]" aria-hidden="true" />
                  </div>
                  <p className="text-sm text-zinc-400 uppercase tracking-wider">
                    Align the QR code inside the frame.
                  </p>
                  <button
                    onClick={startCamera}
                    className="rounded-full px-8 py-4 bg-[var(--accent)] text-[var(--background)] font-bold text-sm hover:bg-opacity-90 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]"
                  >
                    START CAMERA
                  </button>
                  <p className="text-xs text-zinc-500">
                    Your browser will ask for camera permission.
                  </p>
                </div>
              )}

              {status === "starting" && (
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 bg-[var(--background)] p-6 text-center">
                  <Loader2 className="h-8 w-8 text-[var(--accent)] animate-spin" aria-hidden="true" />
                  <p className="text-sm text-zinc-400 uppercase tracking-wider">Starting camera…</p>
                </div>
              )}

              {status === "processing" && (
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 bg-black/60 p-6 text-center">
                  <Loader2 className="h-8 w-8 text-[var(--accent)] animate-spin" aria-hidden="true" />
                  <p className="text-sm font-bold text-[var(--foreground)] uppercase tracking-wider">
                    QR detected — checking marker…
                  </p>
                </div>
              )}

              {error.type !== "none" && (
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 bg-[var(--background)] p-6 text-center">
                  <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[var(--surface)] border border-red-500/20">
                    <X className="h-8 w-8 text-red-400" aria-hidden="true" />
                  </div>
                  <p className="font-black text-[var(--foreground)] uppercase tracking-tight text-lg whitespace-pre-line">
                    {error.message}
                  </p>
                  {(error.type === "permission" || error.type === "generic") && (
                    <button
                      onClick={startCamera}
                      className="rounded-full px-8 py-3 bg-[var(--accent)] text-[var(--background)] font-bold text-sm hover:bg-opacity-90 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]"
                    >
                      TRY AGAIN
                    </button>
                  )}
                  {!secureOk || error.type === "insecure" ? (
                    <p className="text-xs text-zinc-500 max-w-xs">
                      Tip: open this page over HTTPS or on localhost. Camera access is blocked on plain HTTP LAN addresses.
                    </p>
                  ) : null}
                  <button
                    onClick={closeScanner}
                    className="rounded-full px-6 py-3 bg-white/[0.06] text-[var(--foreground)] font-bold text-sm hover:bg-white/[0.1] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]"
                  >
                    BACK
                  </button>
                </div>
              )}

              {(status === "scanning" || error.type === "not-trail-qr") && (
                <div className="absolute bottom-4 left-4 right-4 flex flex-col items-center gap-2">
                  <button
                    onClick={triggerVisionFallback}
                    disabled={visionStatus === "loading" || visionCallCountRef.current >= MAX_VISION_CALLS}
                    className={`flex items-center gap-2 px-5 py-3 rounded-xl font-medium text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] w-full max-w-xs ${
                      visionStatus === "loading"
                        ? "bg-amber-500/20 border border-amber-500/30 text-amber-400 cursor-wait"
                        : visionCallCountRef.current >= MAX_VISION_CALLS
                        ? "bg-zinc-800 border border-white/[0.06] text-zinc-500 cursor-not-allowed"
                        : "bg-[var(--background)] border border-white/[0.06] text-[var(--foreground)] hover:bg-white/[0.03]"
                    }`}
                  >
                    <Zap className="h-4 w-4" aria-hidden="true" />
                    {visionStatus === "loading" ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                        VISION PROCESSING…
                      </>
                    ) : visionStatus === "success" ? (
                      <>
                        <Zap className="h-4 w-4" aria-hidden="true" />
                        VISION DECODED!
                      </>
                    ) : visionCallCountRef.current >= MAX_VISION_CALLS ? (
                      <>
                        <Zap className="h-4 w-4" aria-hidden="true" />
                        VISION LIMIT REACHED
                      </>
                    ) : (
                      <>
                        <Zap className="h-4 w-4" aria-hidden="true" />
                        TRY GOOGLE VISION
                      </>
                    )}
                  </button>
                  {visionCallCountRef.current > 0 && visionCallCountRef.current < MAX_VISION_CALLS && (
                    <span className="text-xs text-zinc-500">
                      Vision used: {visionCallCountRef.current}/{MAX_VISION_CALLS}
                    </span>
                  )}
                </div>
              )}
            </div>

            <div className="flex flex-col gap-3 px-4 py-4">
              <p className="text-center text-xs text-zinc-500 uppercase tracking-widest">
                {status === "scanning" ? "Align the QR inside the frame" : "Point at a Hidden Trail QR marker"}
              </p>
              <div className="flex items-center justify-center gap-3 flex-wrap">
                {status === "scanning" ? (
                  <>
                    <button
                      onClick={switchCamera}
                      className="flex items-center gap-2 px-5 py-3 rounded-xl bg-[var(--background)] border border-white/[0.06] text-[var(--foreground)] font-medium text-sm hover:bg-white/[0.03] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]"
                    >
                      <RefreshCw className="h-4 w-4" aria-hidden="true" /> SWITCH CAMERA
                    </button>
                    <button
                      onClick={stopCamera}
                      className="flex items-center gap-2 px-5 py-3 rounded-xl bg-red-500/20 border border-red-500/20 text-red-400 font-medium text-sm hover:bg-red-500/30 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-400"
                    >
                      <X className="h-4 w-4" aria-hidden="true" /> STOP CAMERA
                    </button>
                  </>
                ) : (
                  status === "idle" && error.type === "none" ? (
                    <button
                      onClick={startCamera}
                      className="rounded-full px-8 py-3 bg-[var(--accent)] text-[var(--background)] font-bold text-sm hover:bg-opacity-90 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]"
                    >
                      START CAMERA
                    </button>
                  ) : null
                )}
              </div>
              <div className="flex items-center justify-center">
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-[var(--muted)] hover:text-[var(--foreground)] transition-colors"
                >
                  <Upload className="h-4 w-4" aria-hidden="true" /> Upload QR image instead
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  aria-label="Upload a QR image"
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    e.target.value = "";
                    if (f) void handleFile(f);
                  }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
      <style jsx>{`
        @keyframes scan-line {
          0% { top: 0%; opacity: 1; }
          50% { top: 100%; opacity: 1; }
          100% { top: 0%; opacity: 1; }
        }
        .animate-scan-line {
          animation: scan-line 2s linear infinite;
        }
        @media (prefers-reduced-motion: reduce) {
          .animate-scan-line {
            animation: none;
            opacity: 0.5;
          }
        }
      `}</style>
    </div>
  );
}

export default HiddenTrailScannerClient;