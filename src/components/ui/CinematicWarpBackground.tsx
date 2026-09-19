"use client";

import { useEffect, useRef } from "react";

interface Streak {
  angle: number;
  radius: number;
  length: number;
  width: number;
  opacity: number;
  speed: number;
  depth: number;
  glow: boolean;
  useAccent: boolean;
}

const createStreak = (canvasWidth: number, canvasHeight: number, useAccentChance: number = 0.1): Streak => {
  const angle = Math.random() * Math.PI * 2;
  const useAccent = Math.random() < useAccentChance;
  const depth = Math.random();
  const baseLength = 40 + Math.random() * 120;
  const length = baseLength * (0.4 + depth * 0.6);
  const strokeWidth = 0.3 + depth * 1.2;
  const opacity = 0.03 + depth * 0.12;
  const speed = 0.15 + depth * 0.85;
  const radius = 0.5 + Math.random() * 25;
  const glow = Math.random() < 0.2 && useAccent;

  return { angle, radius, length, width: strokeWidth, opacity, speed, depth, glow, useAccent };
};

function renderStreak(
  ctx: CanvasRenderingContext2D,
  streak: Streak,
  canvasWidth: number,
  canvasHeight: number,
  vanishingPointX: number,
  vanishingPointY: number
) {
  const centerX = canvasWidth * vanishingPointX;
  const centerY = canvasHeight * vanishingPointY;

  const endX = centerX + Math.cos(streak.angle) * streak.radius;
  const endY = centerY + Math.sin(streak.angle) * streak.radius;

  const startX = centerX + Math.cos(streak.angle) * (streak.radius - streak.length);
  const startY = centerY + Math.sin(streak.angle) * (streak.radius - streak.length);

  let r: number, g: number, b: number;
  if (streak.useAccent) {
    r = 245; g = 208; b = 110;
  } else {
    const baseR = 200;
    const baseG = 205;
    const baseB = 215;
    const depthOffset = (1 - streak.depth) * 20;
    r = baseR - depthOffset;
    g = baseG - depthOffset * 0.5;
    b = baseB;
  }

  ctx.beginPath();
  ctx.moveTo(startX, startY);
  ctx.lineTo(endX, endY);
  ctx.lineWidth = streak.width;

  const gradient = ctx.createLinearGradient(startX, startY, endX, endY);
  gradient.addColorStop(0, `rgba(${r}, ${g}, ${b}, 0)`);
  gradient.addColorStop(0.25, `rgba(${r}, ${g}, ${b}, ${streak.opacity * 0.8})`);
  gradient.addColorStop(1, `rgba(${r}, ${g}, ${b}, 0)`);

  ctx.strokeStyle = gradient;
  ctx.stroke();

  if (streak.glow && streak.useAccent) {
    ctx.shadowColor = `rgba(${r}, ${g}, ${b}, 0.25)`;
    ctx.shadowBlur = streak.width * 3;
    ctx.strokeStyle = `rgba(${r}, ${g}, ${b}, ${streak.opacity * 0.5})`;
    ctx.stroke();
    ctx.shadowColor = "transparent";
    ctx.shadowBlur = 0;
  }
}

const CinematicWarpBackground: React.FC<{
  vanishingPointX?: number;
  vanishingPointY?: number;
  speedMultiplier?: number;
  streakCount?: number;
}> = ({
  vanishingPointX = 0.65,
  vanishingPointY = 0.5,
  speedMultiplier = 1,
  streakCount = 150,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationFrameRef = useRef<number>(0);
  const streaksRef = useRef<Streak[]>([]);
  const reducedMotion =
    typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const resizeCanvas = () => {
      const container = canvas.parentElement;
      if (container) {
        canvas.width = container.clientWidth;
        canvas.height = container.clientHeight;
      }
    };
    resizeCanvas();
    window.addEventListener("resize", resizeCanvas);

    const newStreaks: Streak[] = [];
    for (let i = 0; i < streakCount; i++) {
      newStreaks.push(createStreak(canvas.width, canvas.height, 0.1));
    }
    streaksRef.current = newStreaks;

    return () => {
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
      window.removeEventListener("resize", resizeCanvas);
    };
  }, [streakCount]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    if (typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const draw = () => {
      if (!canvasRef.current) return;
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      for (let i = 0; i < streaksRef.current.length; i++) {
        const streak = streaksRef.current[i];
        streak.radius += streak.speed * speedMultiplier;
        if (streak.radius > Math.max(canvas.width, canvas.height)) {
          streaksRef.current[i] = createStreak(canvas.width, canvas.height, 0.1);
        }
        renderStreak(ctx, streak, canvas.width, canvas.height, vanishingPointX, vanishingPointY);
      }

      animationFrameRef.current = requestAnimationFrame(draw);
    };

    draw();
    return () => {
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
    };
  }, [reducedMotion, speedMultiplier, vanishingPointX, vanishingPointY]);

  return (
    <canvas
      ref={canvasRef}
      className="cinematic-warp-background"
      style={{
        position: "absolute",
        top: 0,
        left: 0,
        width: "100%",
        height: "100%",
        pointerEvents: "none",
      }}
      aria-hidden="true"
    />
  );
};

export default CinematicWarpBackground;