"use client";

import { useEffect, useRef, useState } from "react";
import { uploadTrailPhoto } from "@/lib/api/trail";

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
  const objectUrlRef = useRef<string | null>(null);
  const continuingRef = useRef(false);

  const [cameraOpen, setCameraOpen] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [consent, setConsent] = useState(false);
  const [visibility, setVisibility] = useState<"private" | "gallery">("private");
  const [status, setStatus] = useState<"idle" | "uploading" | "saved" | "error">("idle");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    return () => {
      streamRef.current?.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
      if (objectUrlRef.current) URL.revokeObjectURL(objectUrlRef.current);
    };
  }, []);

  const continueWithoutPhoto = () => {
    if (continuingRef.current || status === "uploading") return;
    continuingRef.current = true;
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    setCameraOpen(false);
    onSkip?.();
  };

  const stopCamera = () => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    setCameraOpen(false);
  };

  const replacePreview = (nextFile: File) => {
    if (objectUrlRef.current) URL.revokeObjectURL(objectUrlRef.current);
    const url = URL.createObjectURL(nextFile);
    objectUrlRef.current = url;
    setFile(nextFile);
    setPreviewUrl(url);
    setError(null);
    setStatus("idle");
  };

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
      replacePreview(new File([blob], "moment.webp", { type: "image/webp" }));
      stopCamera();
    }, "image/webp", 0.9);
  };

  const chooseFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    if (!selected) return;
    replacePreview(selected);
    e.target.value = "";
  };

  const retake = () => {
    if (continuingRef.current || status === "uploading") return;
    if (objectUrlRef.current) {
      URL.revokeObjectURL(objectUrlRef.current);
      objectUrlRef.current = null;
    }
    setPreviewUrl(null);
    setFile(null);
    setError(null);
    setStatus("idle");
  };

  const submit = async () => {
    if (!file || status === "uploading" || continuingRef.current) return;

    setStatus("uploading");
    setError(null);

    try {
      const { photo } = await uploadTrailPhoto(
        file,
        levelId,
        captureStage,
        visibility,
        consent
      );

      setStatus("saved");

      if (continuingRef.current) return;
      continuingRef.current = true;
      streamRef.current?.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
      onSaved?.(photo.id);
    } catch (err) {
      setStatus("error");
      setError(err instanceof Error ? err.message : "Could not save your photo.");
    }
  };

  return (
    <div className="chapter-admin-card" role="region" aria-label="Photo moment">
      <h3 className="chapter-admin-section-title">PHOTO MOMENT</h3>

      {status === "saved" ? (
        <div className="chapter-admin-alert chapter-admin-alert-success">
          <p>Moment saved.</p>
          <button
            type="button"
            className="chapter-admin-btn"
            onClick={continueWithoutPhoto}
          >
            Continue
          </button>
        </div>
      ) : (
        <>
          <p className="text-sm text-zinc-400 mb-4">
            Optional. Your photo never affects your score.
          </p>

          {cameraOpen && !previewUrl && (
            <div className="photo-preview-wrap">
              <video
                ref={videoRef}
                className="photo-preview-video"
                playsInline
                muted
                aria-label="Camera preview"
              />
              <div className="photo-actions">
                <button type="button" className="chapter-admin-btn" onClick={capture}>
                  Capture
                </button>
                <button
                  type="button"
                  className="chapter-admin-btn chapter-admin-btn-outline"
                  onClick={stopCamera}
                >
                  Cancel
                </button>
              </div>
            </div>
          )}

          {previewUrl && (
            <div className="photo-preview-wrap">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={previewUrl}
                alt="Preview of your moment"
                className="photo-preview-img"
              />
              <div className="photo-actions">
                <button
                  type="button"
                  className="chapter-admin-btn"
                  onClick={submit}
                  disabled={status === "uploading"}
                >
                  {status === "uploading" ? "Uploading…" : "Use Photo"}
                </button>
                <button
                  type="button"
                  className="chapter-admin-btn chapter-admin-btn-outline"
                  onClick={retake}
                  disabled={status === "uploading"}
                >
                  Retake
                </button>
                <button
                  type="button"
                  className="chapter-admin-btn chapter-admin-btn-outline"
                  onClick={continueWithoutPhoto}
                  disabled={status === "uploading"}
                >
                  Skip & Continue
                </button>
              </div>
            </div>
          )}

          {!cameraOpen && !previewUrl && (
            <div className="photo-actions">
              <button type="button" className="chapter-admin-btn" onClick={openCamera}>
                Take Photo
              </button>
              <button
                type="button"
                className="chapter-admin-btn chapter-admin-btn-outline"
                onClick={() => fileInputRef.current?.click()}
              >
                Choose from Gallery
              </button>
              <button
                type="button"
                className="chapter-admin-btn chapter-admin-btn-outline"
                onClick={continueWithoutPhoto}
              >
                Skip & Continue
              </button>
            </div>
          )}

          {cameraError && !previewUrl && (
            <p className="photo-error" role="status">{cameraError}</p>
          )}
          {error && <p className="photo-error" role="status">{error}</p>}

          {file && (
            <div className="photo-consent">
              <label className="photo-consent-row">
                <input
                  type="checkbox"
                  checked={consent}
                  onChange={(e) => setConsent(e.target.checked)}
                  disabled={status === "uploading"}
                />
                <span>
                  Keep this photo private, or choose event-gallery visibility.
                  Gallery sharing requires your consent.
                </span>
              </label>
              <label className="photo-consent-row">
                <select
                  value={visibility}
                  onChange={(e) =>
                    setVisibility(e.target.value as "private" | "gallery")
                  }
                  disabled={status === "uploading"}
                  aria-label="Photo visibility"
                >
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
