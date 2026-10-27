import React, { useEffect, useRef } from 'react';
import { gsap } from 'gsap';

/**
 * Skiper 39 canvas background, adapted for a Vite/React page.
 * Animation logic follows the user-supplied 21st.dev example.
 * The original illustration is by Open Peeps; retain attribution per Skiper UI's free license.
 */
const REFERENCE_SPRITESHEET =
  'https://cdn.21st.dev/assets/localized/abdb8990a7bef8c2f5af3e45f0a3c969c4b0603fba8be92e81347de4ea4e1ed7.png';

type Peep = {
  x: number;
  y: number;
  width: number;
  height: number;
  frameX: number;
  frameY: number;
  direction: 1 | -1;
  anchorY: number;
  walk?: gsap.core.Timeline;
};

type Props = {
  src?: string;
  rows?: number;
  cols?: number;
};

export const Skiper39Background: React.FC<Props> = ({
  src = REFERENCE_SPRITESHEET,
  rows = 15,
  cols = 7,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;

    const image = new Image();
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
    const peeps: Peep[] = [];
    const active: Peep[] = [];
    const available: Peep[] = [];
    let disposed = false;
    let initialized = false;
    let stageWidth = 0;
    let stageHeight = 0;
    let frameWidth = 0;
    let frameHeight = 0;
    let running = false;

    const random = (min: number, max: number) => min + Math.random() * (max - min);

    const stopWalks = () => {
      peeps.forEach((peep) => peep.walk?.kill());
      active.length = 0;
      available.length = 0;
    };

    const startWalk = (peep: Peep) => {
      if (disposed || reducedMotion.matches) return;
      const direction: 1 | -1 = Math.random() > 0.5 ? 1 : -1;
      const offsetY = 100 - 250 * gsap.parseEase('power2.in')(Math.random());
      const startY = stageHeight - peep.height + offsetY;
      const startX = direction === 1 ? -peep.width : stageWidth + peep.width;
      const endX = direction === 1 ? stageWidth : 0;

      peep.x = startX;
      peep.y = startY;
      peep.anchorY = startY;
      peep.direction = direction;
      active.push(peep);
      active.sort((a, b) => a.anchorY - b.anchorY);

      const timeline = gsap.timeline({
        onComplete: () => {
          if (disposed) return;
          const index = active.indexOf(peep);
          if (index !== -1) active.splice(index, 1);
          available.push(peep);
          const next = available.pop();
          if (next) startWalk(next);
        },
      });
      timeline.timeScale(random(0.5, 1.5));
      timeline.to(peep, { x: endX, duration: 10, ease: 'none' }, 0);
      timeline.to(
        peep,
        { y: startY - 10, duration: 0.25, repeat: 40, yoyo: true },
        0,
      );
      peep.walk = timeline;
      return timeline;
    };

    const draw = () => {
      if (disposed || !initialized || document.hidden) return;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      active.forEach((peep) => {
        ctx.save();
        ctx.translate(peep.x, peep.y);
        ctx.scale(peep.direction, 1);
        ctx.drawImage(
          image, peep.frameX, peep.frameY, frameWidth, frameHeight,
          0, 0, peep.width, peep.height,
        );
        ctx.restore();
      });
    };

    const resize = () => {
      if (disposed || !initialized) return;
      stageWidth = canvas.clientWidth;
      stageHeight = canvas.clientHeight;
      if (!stageWidth || !stageHeight) return;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.round(stageWidth * dpr);
      canvas.height = Math.round(stageHeight * dpr);
      stopWalks();
      if (reducedMotion.matches) {
        // One static reference frame; no motion when the user requests reduced motion.
        peeps.forEach((peep, index) => {
          peep.x = (index / peeps.length) * stageWidth;
          peep.y = stageHeight - peep.height - random(0, 115);
          peep.direction = 1;
          active.push(peep);
        });
        draw();
      } else {
        available.push(...peeps);
        while (available.length) {
          const index = Math.floor(random(0, available.length));
          const peep = available.splice(index, 1)[0];
          const walk = startWalk(peep);
          walk?.progress(Math.random());
        }
      }
    };

    const onImageLoad = () => {
      if (disposed || !image.naturalWidth || !image.naturalHeight) return;
      frameWidth = image.naturalWidth / rows;
      frameHeight = image.naturalHeight / cols;
      peeps.length = 0;
      for (let i = 0; i < rows * cols; i++) {
        peeps.push({
          x: 0,
          y: 0,
          width: frameWidth,
          height: frameHeight,
          frameX: (i % rows) * frameWidth,
          frameY: Math.floor(i / rows) * frameHeight,
          direction: 1,
          anchorY: 0,
        });
      }
      initialized = true;
      resize();
      gsap.ticker.add(draw);
      running = true;
    };

    image.onload = onImageLoad;
    image.src = src;
    const observer = new ResizeObserver(resize);
    observer.observe(canvas);
    reducedMotion.addEventListener('change', resize);

    return () => {
      disposed = true;
      image.onload = null;
      observer.disconnect();
      reducedMotion.removeEventListener('change', resize);
      if (running) gsap.ticker.remove(draw);
      stopWalks();
    };
  }, [src, rows, cols]);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 block h-full w-full"
    />
  );
};

export default Skiper39Background;
