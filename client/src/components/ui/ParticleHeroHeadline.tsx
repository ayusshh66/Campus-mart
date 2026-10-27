import React, { useEffect, useRef } from "react";

type Point = { x: number; y: number };

type Dot = {
  x: number;
  y: number;
  vx: number;
  vy: number;
  target: Point;
  size: number;
  color: string;
};

interface ParticleHeroHeadlineProps {
  text: string;
  className?: string;
}

/**
 * CampusMart adaptation of the supplied 21st.dev particle-text effect.
 * Keeps the canvas transparent so the Unicorn Studio hero remains visible.
 */
export default function ParticleHeroHeadline({
  text,
  className = "",
}: ParticleHeroHeadlineProps) {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const wrapper = wrapperRef.current;
    if (!canvas || !wrapper) return;

    const context = canvas.getContext("2d");
    if (!context) return;
    const ctx: CanvasRenderingContext2D = context;

    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const dots: Dot[] = [];
    let width = 0;
    let height = 0;
    let raf = 0;
    let lastReset = performance.now();
    let lastFrame = performance.now();
    let isVisible = true;

    const initialLines = ["BECOME THE FACE OF", "CAMPUSMART AT YOUR COLLEGE."];
    const mobileLines = ["BECOME THE FACE OF", "CAMPUSMART AT", "YOUR COLLEGE."];

    // Keep the original phrase accessible while the canvas supplies its visuals.
    const build = () => {
      const rect = wrapper.getBoundingClientRect();
      width = Math.max(1, Math.round(rect.width));
      height = Math.max(1, Math.round(rect.height));
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.round(width * dpr);
      canvas.height = Math.round(height * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      const offscreen = document.createElement("canvas");
      offscreen.width = width;
      offscreen.height = height;
      const maskingContext = offscreen.getContext("2d", { willReadFrequently: true });
      if (!maskingContext) return;
      const mask: CanvasRenderingContext2D = maskingContext;

      const lines = width < 620 ? mobileLines : initialLines;
      let fontSize = Math.min(width < 620 ? 42 : 80, height / (lines.length * 1.22));
      mask.textAlign = "center";
      mask.textBaseline = "middle";
      do {
        mask.font = `900 ${fontSize}px Arial, Helvetica, sans-serif`;
        if (lines.every((line) => mask.measureText(line).width <= width * 0.97)) break;
        fontSize -= 1;
      } while (fontSize > 13);

      mask.fillStyle = "#fff";
      const lineHeight = fontSize * 1.26;
      const startY = height / 2 - (lines.length - 1) * lineHeight / 2;
      lines.forEach((line, index) => {
        mask.fillText(line, width / 2, startY + index * lineHeight);
      });

      const pixels = mask.getImageData(0, 0, width, height).data;
      const spacing = width < 620 ? 3 : 4;
      const targets: Point[] = [];
      for (let y = 0; y < height; y += spacing) {
        for (let x = 0; x < width; x += spacing) {
          if (pixels[(y * width + x) * 4 + 3] > 128) {
            targets.push({ x, y });
          }
        }
      }

      // Shuffle targets to make the particle assembly feel organic.
      for (let i = targets.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [targets[i], targets[j]] = [targets[j], targets[i]];
      }

      const cap = width < 620 ? 1700 : 3200;
      const sampled = targets.length > cap
        ? targets.filter((_, index) => index % Math.ceil(targets.length / cap) === 0)
        : targets;

      dots.length = 0;
      sampled.forEach((target, index) => {
        const angle = Math.random() * Math.PI * 2;
        const distance = Math.max(width, height) * (0.3 + Math.random() * 0.5);
        dots.push({
          x: reducedMotion ? target.x : width / 2 + Math.cos(angle) * distance,
          y: reducedMotion ? target.y : height / 2 + Math.sin(angle) * distance,
          vx: 0,
          vy: 0,
          target,
          size: width < 620 ? 1.65 : 2.2,
          // Vibrant CampusMart theme: #C6DE41 neon green with electric lime highlights
          color:
            index % 7 === 0
              ? "#EAFAB0"
              : index % 4 === 0
              ? "#D7EF59"
              : index % 11 === 0
              ? "#A8C22E"
              : "#C6DE41",
        });
      });
      lastReset = performance.now();
      draw(lastReset);
    };

    const draw = (now: number) => {
      ctx.clearRect(0, 0, width, height);
      // Time-step normalization avoids jumping if browser FPS drops.
      const dt = Math.min(2, Math.max(0.3, (now - lastFrame) / 16.67));
      lastFrame = now;

      for (const dot of dots) {
        if (!reducedMotion) {
          // Target-seeking motion inspired by the user's supplied Particle class.
          const dx = dot.target.x - dot.x;
          const dy = dot.target.y - dot.y;
          dot.vx = (dot.vx + dx * 0.017 * dt) * Math.pow(0.82, dt);
          dot.vy = (dot.vy + dy * 0.017 * dt) * Math.pow(0.82, dt);
          dot.x += dot.vx * dt;
          dot.y += dot.vy * dt;
        }
        ctx.fillStyle = dot.color;
        ctx.fillRect(dot.x, dot.y, dot.size, dot.size);
      }
    };

    const frame = (now: number) => {
      if (!isVisible) return;
      // Replay the gathering effect occasionally without changing the words.
      if (now - lastReset > 12000 && !reducedMotion) {
        for (const dot of dots) {
          const angle = Math.random() * Math.PI * 2;
          const radius = 120 + Math.random() * Math.max(width, height) * 0.35;
          dot.x += Math.cos(angle) * radius;
          dot.y += Math.sin(angle) * radius;
          dot.vx = 0;
          dot.vy = 0;
        }
        lastReset = now;
      }
      draw(now);
      raf = window.requestAnimationFrame(frame);
    };

    const observer = new ResizeObserver(() => build());
    observer.observe(wrapper);
    build();
    if (!reducedMotion) raf = window.requestAnimationFrame(frame);

    const handleVisibility = () => {
      isVisible = !document.hidden;
      if (isVisible && !reducedMotion) {
        lastFrame = performance.now();
        raf = window.requestAnimationFrame(frame);
      } else {
        window.cancelAnimationFrame(raf);
      }
    };
    document.addEventListener("visibilitychange", handleVisibility);

    return () => {
      window.cancelAnimationFrame(raf);
      observer.disconnect();
      document.removeEventListener("visibilitychange", handleVisibility);
    };
  }, [text]);

  return (
    <div ref={wrapperRef} className={`relative w-full ${className}`}>
      <canvas
        ref={canvasRef}
        aria-hidden="true"
        className="block h-full w-full"
        style={{ background: "transparent" }}
      />
    </div>
  );
}
