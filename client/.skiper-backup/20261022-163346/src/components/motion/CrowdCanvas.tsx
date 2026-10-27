import React, { useEffect, useRef } from 'react';
import gsap from 'gsap';

/**
 * Skiper 39-style walking crowd. Uses a LOCAL transparent sprite sheet.
 * The canvas never handles clicks or sits above the hero's text/controls.
 * Animation concept credit: https://skiper-ui.com/v1/skiper39
 */
type CrowdCanvasProps = {
  src?: string;
  rows?: number; // sprites across the sheet
  cols?: number; // sprite rows down the sheet
};

type Peep = {
  frame: number;
  x: number;
  y: number;
  width: number;
  height: number;
  direction: 1 | -1;
  phase: number;
};

export const CrowdCanvas: React.FC<CrowdCanvasProps> = ({
  src = '/images/peeps/all-peeps.png', rows = 15, cols = 7,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;

    const image = new Image();
    let disposed = false;
    let ready = false;
    const peeps: Peep[] = [];
    const tweens: gsap.core.Tween[] = [];
    const random = (min: number, max: number) => min + Math.random() * (max - min);
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
    let observer: ResizeObserver | undefined;
    let cellWidth = 64;
    let cellHeight = 96;
    let displayWidth = 0;
    let displayHeight = 0;
    let subscribed = false;

    const draw = () => {
      if (!ready || disposed || document.hidden) return;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      const elapsed = performance.now() / 1000;
      // Sorting makes visually lower figures appear in front of distant ones.
      [...peeps].sort((a, b) => a.y - b.y).forEach((person) => {
        const column = person.frame % rows;
        const row = Math.floor(person.frame / rows);
        const bob = reduced.matches ? 0 : Math.sin(elapsed * 12 + person.phase) * 2;
        ctx.save();
        ctx.translate(person.x + person.width / 2, person.y + bob);
        ctx.scale(person.direction, 1);
        ctx.drawImage(
          image, column * cellWidth, row * cellHeight, cellWidth, cellHeight,
          -person.width / 2, 0, person.width, person.height,
        );
        ctx.restore();
      });
    };

    const reset = () => {
      if (!ready || disposed) return;
      tweens.forEach((tween) => tween.kill());
      tweens.length = 0;
      peeps.length = 0;
      const rect = canvas.getBoundingClientRect();
      displayWidth = rect.width;
      displayHeight = rect.height;
      if (!displayWidth || !displayHeight) return;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.max(1, Math.floor(displayWidth * dpr));
      canvas.height = Math.max(1, Math.floor(displayHeight * dpr));

      const count = reduced.matches ? 9 : (displayWidth < 640 ? 11 : 19);
      const totalFrames = rows * cols;
      for (let i = 0; i < count; i++) {
        const scale = random(displayWidth < 640 ? 0.52 : 0.67, displayWidth < 640 ? 0.78 : 1.0);
        const width = cellWidth * scale;
        const height = cellHeight * scale;
        const direction: 1 | -1 = i % 2 === 0 ? 1 : -1;
        const startX = direction === 1 ? -width : displayWidth + width;
        const peep: Peep = {
          frame: Math.floor(random(0, totalFrames)),
          x: reduced.matches ? (i + 0.5) * displayWidth / count : startX,
          y: Math.max(0, displayHeight - height - random(0, 22)),
          width, height, direction,
          phase: random(0, Math.PI * 2),
        };
        peeps.push(peep);
        if (!reduced.matches) {
          const endX = direction === 1 ? displayWidth + width : -width;
          const tween = gsap.fromTo(peep,
            { x: startX },
            {
              x: endX,
              duration: random(14, 24),
              ease: 'none',
              repeat: -1,
              delay: -random(0, 18),
            },
          );
          tweens.push(tween);
        }
      }
      draw();
    };

    const setup = () => {
      if (disposed) return;
      ready = true;
      cellWidth = image.naturalWidth / rows;
      cellHeight = image.naturalHeight / cols;
      reset();
      if (!reduced.matches && !subscribed) {
        gsap.ticker.add(draw);
        subscribed = true;
      }
    };

    image.onload = setup;
    image.onerror = () => { ready = false; }; // Missing sprite: no crash, no broken icon.
    image.src = src;
    observer = new ResizeObserver(reset);
    observer.observe(canvas);
    const onMotionChange = () => {
      if (subscribed) gsap.ticker.remove(draw);
      subscribed = false;
      reset();
      if (!reduced.matches && ready) {
        gsap.ticker.add(draw);
        subscribed = true;
      }
    };
    reduced.addEventListener('change', onMotionChange);

    return () => {
      disposed = true;
      image.onload = null;
      image.onerror = null;
      observer?.disconnect();
      reduced.removeEventListener('change', onMotionChange);
      if (subscribed) gsap.ticker.remove(draw);
      tweens.forEach((tween) => tween.kill());
    };
  }, [src, rows, cols]);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 h-full w-full"
    />
  );
};
