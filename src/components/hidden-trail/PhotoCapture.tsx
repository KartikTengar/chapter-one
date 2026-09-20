"use client";

import { useRef, useState, useCallback, useEffect } from "react";
import { uploadTrailPhoto, ApiTrailError } from "@/lib/api/trail";

type CaptureStage = "before_answer" | "after_completion";

export function PhotoCapture({
  levelId,
  captureStage = "after_completion",
  onSaved,
  onSkip,
}: {
  levelId: string;
  captureStage?: CaptureStage;
  onSaved?: (photoId: string) => void;
  onSkip?: () => void;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [cameraOpen, setCameraOpen] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [consent, setConsent] = useState(false);
  const [visibility, setVisibility] = useState<"private" | "gallery">("private");
  const [status, setStatus] = useState<"idle" | "uploading" | "saved" | "error">("idle");
  const [error, setError] = useState<string | null>(null);
  const [uploadAborted, setUploadAborted] = useState(false);

  // Clean up camera stream on unmount
  useEffect(() => {
    return () => {
      streamRef.current?.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  const stopCamera = useCallback(() => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    setCameraOpen(false);
  }, []);

  const openCamera = async () => {
    setCameraError(null);
    try {
      if (!navigator.mediaDevices?.getUserMedia) {
        setCameraError("Camera unavailable. Choose a photo from your device instead.");
        return;
      }
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment" },
        audio: false,
      });
      streamRef.current = stream;
      setCameraOpen(true);
      requestAnimationFrame(() => {
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.play().catch(() => undefined);
        }
      });
    } catch {
      setCameraError("Camera access isn't available. You can choose a photo from your gallery instead.");
    }
  };

  const capture = () => {
    const video = videoRef.current;
    if (!video || !video.videoWidth) return;
    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.drawImage(video, 0, 0);
    canvas.toBlob((blob) => {
      if (!blob) return;
      const f = new File([blob], "moment.webp", { type: "image/webp" });
      setFile(f);
      setPreviewUrl(URL.createObjectURL(f));
      stopCamera();
    }, "image/webp", 0.9);
  };

  const chooseFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    setFile(f);
    setPreviewUrl(URL.createObjectURL(f));
    setError(null);
    setStatus("idle");
  };

  const retake = () => {
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }
    setPreviewUrl(null);
    setFile(null);
    setError(null);
    setStatus("idle");
  };

  const handleSkip = useCallback(() => {
    // Clean up any pending upload state
    setUploadAborted(true);
    stopCamera();
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
      setPreviewUrl(null);
    }
    setFile(null);
    onSkip?.();
  }, [onSkip, previewUrl, stopCamera]);

  const submit = async () => {
    if (!file || status === "uploading") return;
    setUploadAborted(false);
    setStatus("uploading");
    setError(null);
    try {
      const { photo } = await uploadTrailPhoto(file, levelId, captureStage, visibility, consent);
      if (uploadAborted) return; // User skipped during upload
      setStatus("saved");
      // Auto-continue after successful upload
      onSaved?.(photo.id);
    } catch (err) {
      if (uploadAborted) return; // User skipped during upload
      setStatus("error");
      const message = err instanceof ApiTrailError
        ? err.code === "PHOTO_DISABLED"
          ? "Photo moments are disabled for this game."
          : err.message
        : err instanceof Error
          ? err.message
          : "Could not save your photo. Please try again.";
      setError(message);
    }
  };

  return (
    <div className="chapter-admin-card" role="region" aria-label="Photo moment">
      <h3 className="chapter-admin-section-title">PHOTO MOMENT</h3>

      {/* Skip/Continue button - ALWAYS VISIBLE at the top */}
      <div className="photo-skip-bar" style={{ marginBottom: "1rem", textAlign: "right" }}>
        <button
          className="chapter-admin-btn chapter-admin-btn-outline"
          onClick={handleSkip}
          disabled={status === "uploading"}
          aria-label="Skip photo and continue"
        >
          {status === "uploading" ? "Uploading…" : "Skip / Continue"}
        </button>
      </div>

      {status === "saved" ? (
        <div className="chapter-admin-alert chapter-admin-alert-success" style={{ textAlign: "center" }}>
          <p>Moment saved. Continuing…</p>
        </div>
      ) : (
        <>
          {cameraOpen && !previewUrl && (
            <div className="photo-preview-wrap">
              <video ref={videoRef} className="photo-preview-video" playsInline muted aria-label="Camera preview" />
              <div className="photo-actions" style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap", justifyContent: "center" }}>
                <button className="chapter-admin-btn" onClick={capture}>Capture</button>
                <button className="chapter-admin-btn chapter-admin-btn-outline" onClick={stopCamera}>Cancel</button>
              </div>
            </div>
          )}

          {previewUrl && (
            <div className="photo-preview-wrap">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={previewUrl} alt="Preview of your moment" className="photo-preview-img" />
              <div className="photo-actions" style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap", justifyContent: "center" }}>
                <button
                  className="chapter-admin-btn"
                  onClick={submit}
                  disabled={status === "uploading"}
                >
                  {status === "uploading" ? "Uploading…" : "Use Photo"}
                </button>
                <button className="chapter-admin-btn chapter-admin-btn-outline" onClick={retake}>Retake</button>
              </div>
            </div>
          )}

          {!cameraOpen && !previewUrl && (
            <div className="photo-actions" style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap", justifyContent: "center" }}>
              <button className="chapter-admin-btn" onClick={openCamera}>Take Photo</button>
              <button className="chapter-admin-btn chapter-admin-btn-outline" onClick={() => fileInputRef.current?.click()}>
                Choose from Gallery
              </button>
            </div>
          )}

          {cameraError && !previewUrl && <p className="photo-error" role="status">{cameraError}</p>}
          {error && <p className="photo-error" role="status">{error}</p>}

          {file && (
            <div className="photo-consent" style={{ marginTop: "1rem", paddingTop: "1rem", borderTop: "1px solid var(--border)" }}>
              <label className="photo-consent-row" style={{ display: "flex", alignItems: "flex-start", gap: "0.5rem", marginBottom: "0.75rem" }}>
                <input type="checkbox" checked={consent} onChange={(e) => setConsent(e.target.checked)} />
                <span style={{ fontSize: "0.875rem", color: "var(--muted)" }}>
                  Your photo can stay private, or you can choose to include it in the event gallery. It never affects your score.
                </span>
              </label>
              <label className="photo-consent-row" style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                <select value={visibility} onChange={(e) => setVisibility(e.target.value as "private" | "gallery")} aria-label="Photo visibility" style={{ flex: 1, maxWidth: "300px" }}>
                  <option value="private">Private</option>
                  <option value="gallery">Include in event gallery</option>
                </select>
              </label>
            </div>
          )}

          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            onChange={chooseFile}
            style={{ display: "none" }}
            aria-label="Choose a photo"
          />
        </>
      )}
    </div>
  );
}